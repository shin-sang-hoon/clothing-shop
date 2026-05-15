package com.example.demo.audit.application;

import com.example.demo.audit.domain.*;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * AuditLogService
 * - 감사 로그 저장 전용 서비스
 * - 현재는 JPA 저장 방식
 * - 나중에 MSA 전환 시 이 레이어만 교체 가능하도록 분리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final MemberRepository memberRepository;

    /**
     * 회원 로그인 성공 로그 저장
     */
    @Transactional
    public void logMemberLoginSuccess(
            Long memberId,
            String email,
            HttpServletRequest request
    ) {
        saveAuditLog(
                AuditCategory.MEMBER,
                AuditEventType.LOGIN_SUCCESS,
                AuditResult.SUCCESS,
                memberId,
                email,
                "회원 로그인 성공",
                request
        );
    }

    /**
     * 회원 로그인 실패 로그 저장
     * - 존재하지 않는 이메일 / 비밀번호 불일치를 구분해 사용자에게는 노출하지 않지만
     * 관리자 분석용 로그는 남길 수 있음
     */
    @Transactional
    public void logMemberLoginFail(
            String email,
            String message,
            HttpServletRequest request
    ) {
        saveAuditLog(
                AuditCategory.MEMBER,
                AuditEventType.LOGIN_FAIL,
                AuditResult.FAIL,
                null,
                email,
                message,
                request
        );
    }

    /**
     * 회원 로그아웃 성공 로그 저장
     */
    @Transactional
    public void logMemberLogout(
            Long memberId,
            String email,
            HttpServletRequest request
    ) {
        saveAuditLog(
                AuditCategory.MEMBER,
                AuditEventType.LOGOUT,
                AuditResult.SUCCESS,
                memberId,
                email,
                "회원 로그아웃 성공",
                request
        );
    }

    @Transactional
    public void logMemberSignupSuccess(
            Long memberId,
            String email,
            HttpServletRequest request
    ) {
        saveAuditLog(
                AuditCategory.MEMBER,
                AuditEventType.SIGNUP_SUCCESS,
                AuditResult.SUCCESS,
                memberId,
                email,
                "회원가입 성공",
                request
        );
    }

    @Transactional
    public void logPasswordResetSuccess(
            Long memberId,
            String email,
            HttpServletRequest request
    ) {
        saveAuditLog(
                AuditCategory.MEMBER,
                AuditEventType.PASSWORD_RESET_SUCCESS,
                AuditResult.SUCCESS,
                memberId,
                email,
                "비밀번호 재설정 성공",
                request
        );
    }

    @Transactional
    public void logTokenRefreshSuccess(
            Long memberId,
            String email,
            HttpServletRequest request
    ) {
        saveAuditLog(
                AuditCategory.MEMBER,
                AuditEventType.TOKEN_REFRESH,
                AuditResult.SUCCESS,
                memberId,
                email,
                "토큰 재발급 성공",
                request
        );
    }

    @Transactional
    public void logSocialConnectSuccess(
            Long memberId,
            String email,
            String provider,
            HttpServletRequest request
    ) {
        saveAuditLog(
                AuditCategory.MEMBER,
                AuditEventType.SOCIAL_CONNECT,
                AuditResult.SUCCESS,
                memberId,
                email,
                "소셜 계정 연결 성공: " + provider,
                request
        );
    }

    @Transactional
    public void logCurrentActorAction(
            AuditCategory category,
            AuditEventType eventType,
            String message,
            HttpServletRequest request
    ) {
        CurrentActor actor = resolveCurrentActor();
        saveAuditLog(
                category,
                eventType,
                AuditResult.SUCCESS,
                actor.actorId(),
                actor.actorEmail(),
                message,
                request
        );
    }

    /**
     * 공통 저장 메서드
     */
    private void saveAuditLog(
            AuditCategory category,
            AuditEventType eventType,
            AuditResult result,
            Long actorId,
            String actorEmail,
            String message,
            HttpServletRequest request
    ) {
        try {
            AuditLog auditLog = AuditLog.create(
                    category,
                    eventType,
                    result,
                    actorId,
                    actorEmail,
                    message,
                    extractClientIp(request),
                    extractUserAgent(request),
                    extractRequestUri(request),
                    extractMethod(request)
            );

            auditLogRepository.save(auditLog);

            log.info(
                    "감사 로그 저장 완료. category={}, eventType={}, result={}, actorId={}, actorEmail={}",
                    category,
                    eventType,
                    result,
                    actorId,
                    actorEmail
            );
        } catch (Exception ex) {
            /**
             * 감사 로그 저장 실패가 본 업무 흐름까지 막지 않도록 방어
             * - 현재는 예외를 삼키고 서버 로그만 남김
             * - 추후 정책에 따라 재시도/비동기 전송 등으로 확장 가능
             */
            log.error(
                    "감사 로그 저장 실패. category={}, eventType={}, actorEmail={}",
                    category,
                    eventType,
                    actorEmail,
                    ex
            );
        }
    }

    /**
     * 클라이언트 IP 추출
     * - 프록시 환경을 고려해 X-Forwarded-For 우선 확인
     */
    private String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    /**
     * User-Agent 추출
     */
    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        return request.getHeader("User-Agent");
    }

    /**
     * 요청 URI 추출
     */
    private String extractRequestUri(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        return request.getRequestURI();
    }

    /**
     * HTTP Method 추출
     */
    private String extractMethod(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        return request.getMethod();
    }

    private CurrentActor resolveCurrentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return new CurrentActor(null, null);
        }

        String actorEmail = authentication.getName().trim().toLowerCase();
        Optional<Member> member = memberRepository.findByEmail(actorEmail);
        return new CurrentActor(member.map(Member::getId).orElse(null), actorEmail);
    }

    private record CurrentActor(Long actorId, String actorEmail) {}
}
