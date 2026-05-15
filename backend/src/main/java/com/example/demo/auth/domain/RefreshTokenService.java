package com.example.demo.auth.domain;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * RefreshTokenService
 * - refresh token 원문은 쿠키로만 전달
 * - DB에는 SHA-256 해시만 저장
 * - refresh 호출 시 기존 토큰 revoked 처리 + 새 토큰 발급(회전)
 * - persistent 플래그를 함께 저장해서
 * refresh 회전 이후에도 세션/지속 로그인 정책이 바뀌지 않도록 유지
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * refresh token 유지 일수
     * - application.yml / 환경변수 APP_JWT_REFRESH_DAYS 값 사용
     */
    @Value("${app.jwt.refresh-days}")
    private long refreshDays;

    /**
     * refresh token 발급
     *
     * @param memberId        회원 ID
     * @param persistentLogin 로그인 유지 여부
     * @return 클라이언트 쿠키에 저장할 raw refresh token
     */
    @Transactional
    public String issueRefreshToken(Long memberId, boolean persistentLogin) {
        String raw = UUID.randomUUID().toString() + "-" + UUID.randomUUID();
        String hash = sha256(raw);

        RefreshToken rt = new RefreshToken();
        rt.setMemberId(memberId);
        rt.setTokenHash(hash);

        /**
         * DB 만료일도 APP_JWT_REFRESH_DAYS 기준으로 저장
         */
        rt.setExpiresAt(LocalDateTime.now().plusDays(refreshDays));
        rt.setRevoked(false);
        rt.setPersistent(persistentLogin);

        refreshTokenRepository.save(rt);
        return raw;
    }

    /**
     * refresh token 회전
     * - 기존 토큰 revoked 처리
     * - 동일한 persistent 정책으로 새 토큰 발급
     */
    @Transactional
    public RefreshRotationResult rotate(String rawToken) {
        String hash = sha256(rawToken);

        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (existing.isRevoked()) {
            throw new IllegalArgumentException("Refresh token revoked");
        }

        if (existing.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Refresh token expired");
        }

        existing.setRevoked(true);

        boolean persistentLogin = existing.isPersistent();
        String newRaw = issueRefreshToken(existing.getMemberId(), persistentLogin);

        return new RefreshRotationResult(
                existing.getMemberId(),
                newRaw,
                persistentLogin
        );
    }

    /**
     * raw refresh token 기준 revoke 처리
     */
    @Transactional
    public void revokeByRawToken(String rawToken) {
        String hash = sha256(rawToken);

        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            if (!token.isRevoked()) {
                token.setRevoked(true);
            }
        });
    }

    /**
     * 회원 기준 전체 refresh token 제거
     */
    @Transactional
    public void revokeAll(Long memberId) {
        refreshTokenRepository.deleteByMemberId(memberId);
    }

    /**
     * refresh 회전 결과
     */
    public record RefreshRotationResult(
            Long memberId,
            String newRefreshRaw,
            boolean persistentLogin
    ) {
    }

    /**
     * raw refresh token으로 유효 토큰 정보를 조회
     * - revoked/만료 토큰이면 Optional.empty()
     */
    @Transactional(readOnly = true)
    public Optional<ValidRefreshTokenInfo> findValidTokenInfo(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }

        String hash = sha256(rawToken);

        return refreshTokenRepository.findByTokenHash(hash)
                .filter(token -> !token.isRevoked())
                .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(token -> new ValidRefreshTokenInfo(token.getMemberId(), token.isPersistent()));
    }

    public record ValidRefreshTokenInfo(
            Long memberId,
            boolean persistentLogin
    ) {
    }

    /**
     * SHA-256 해시
     */
    private static String sha256(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
