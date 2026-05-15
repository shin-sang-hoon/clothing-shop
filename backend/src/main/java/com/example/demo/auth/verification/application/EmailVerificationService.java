package com.example.demo.auth.verification.application;

import com.example.demo.auth.verification.domain.EmailVerification;
import com.example.demo.auth.verification.domain.EmailVerificationRepository;
import com.example.demo.auth.verification.domain.VerificationPurpose;
import com.example.demo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * EmailVerificationService
 * - 이메일 인증번호 생성/저장/검증 담당
 * - 회원가입 / 비밀번호 재설정 모두 처리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmtpMailService smtpMailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.mail.auth-code-expire-minutes}")
    private long authCodeExpireMinutes;

    /**
     * 회원가입 인증번호 전송
     */
    @Transactional
    public void sendSignupVerificationCode(String email) {
        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("이메일이 비어 있습니다.");
        }

        if (memberRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        sendVerificationCode(normalizedEmail, VerificationPurpose.SIGNUP);
    }

    /**
     * 회원가입 인증번호 검증
     */
    @Transactional
    public void verifySignupCode(String email, String code) {
        verifyCode(email, code, VerificationPurpose.SIGNUP);
    }

    /**
     * 회원가입 가능 여부 확인
     */
    @Transactional(readOnly = true)
    public boolean isSignupVerified(String email) {
        return isVerified(email, VerificationPurpose.SIGNUP);
    }

    /**
     * 비밀번호 재설정 인증번호 전송
     */
    @Transactional
    public void sendPasswordResetCode(String email) {
        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("이메일이 비어 있습니다.");
        }

        if (!memberRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("가입된 이메일을 찾을 수 없습니다.");
        }

        sendVerificationCode(normalizedEmail, VerificationPurpose.PASSWORD_RESET);
    }

    /**
     * 비밀번호 재설정 인증번호 검증
     */
    @Transactional
    public void verifyPasswordResetCode(String email, String code) {
        verifyCode(email, code, VerificationPurpose.PASSWORD_RESET);
    }

    /**
     * 비밀번호 재설정 가능 여부 확인
     */
    @Transactional(readOnly = true)
    public boolean canResetPassword(String email) {
        return isVerified(email, VerificationPurpose.PASSWORD_RESET);
    }

    /**
     * 비밀번호 재설정 완료 후 인증 이력 제거
     * - 재사용 방지 목적
     */
    @Transactional
    public void clearPasswordResetVerification(String email) {
        String normalizedEmail = normalizeEmail(email);
        emailVerificationRepository.deleteByEmailAndPurpose(
                normalizedEmail,
                VerificationPurpose.PASSWORD_RESET
        );
    }

    /**
     * 인증번호 전송 공통 처리
     */
    private void sendVerificationCode(String email, VerificationPurpose purpose) {
        String code = generateSixDigitCode();

        EmailVerification verification = new EmailVerification();
        verification.setEmail(email);
        verification.setPurpose(purpose);
        verification.setCodeHash(passwordEncoder.encode(code));
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(authCodeExpireMinutes));
        verification.setVerifiedAt(null);

        emailVerificationRepository.save(verification);

        String subject = switch (purpose) {
            case SIGNUP -> "[MUREAM] 회원가입 이메일 인증번호 안내";
            case PASSWORD_RESET -> "[MUREAM] 비밀번호 재설정 인증번호 안내";
        };

        String content = switch (purpose) {
            case SIGNUP -> """
                    안녕하세요.

                    회원가입 이메일 인증번호는 아래와 같습니다.

                    인증번호: %s

                    인증번호는 잠시 후 만료됩니다.
                    """.formatted(code);
            case PASSWORD_RESET -> """
                    안녕하세요.

                    비밀번호 재설정 인증번호는 아래와 같습니다.

                    인증번호: %s

                    인증번호는 잠시 후 만료됩니다.
                    """.formatted(code);
        };

        smtpMailService.sendMail(email, subject, content);

        log.info("이메일 인증번호 발송 완료. email={}, purpose={}", email, purpose);
    }

    /**
     * 인증번호 검증 공통 처리
     */
    private void verifyCode(String email, String code, VerificationPurpose purpose) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedCode = code == null ? "" : code.trim();

        EmailVerification verification = emailVerificationRepository
                .findTopByEmailAndPurposeOrderByIdDesc(normalizedEmail, purpose)
                .orElseThrow(() -> new IllegalArgumentException("인증번호를 먼저 요청해주세요."));

        if (verification.getVerifiedAt() != null) {
            log.info("이미 인증 완료된 이메일. email={}, purpose={}", normalizedEmail, purpose);
            return;
        }

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("인증번호가 만료되었습니다. 다시 요청해주세요.");
        }

        if (!passwordEncoder.matches(normalizedCode, verification.getCodeHash())) {
            throw new IllegalArgumentException("인증번호가 올바르지 않습니다.");
        }

        verification.setVerifiedAt(LocalDateTime.now());

        log.info("이메일 인증 완료. email={}, purpose={}", normalizedEmail, purpose);
    }

    /**
     * 인증 완료 여부 조회 공통 처리
     */
    private boolean isVerified(String email, VerificationPurpose purpose) {
        String normalizedEmail = normalizeEmail(email);

        return emailVerificationRepository
                .findTopByEmailAndPurposeAndVerifiedAtIsNotNullOrderByIdDesc(normalizedEmail, purpose)
                .filter(verification -> verification.getExpiresAt().isAfter(LocalDateTime.now()))
                .isPresent();
    }

    /**
     * 이메일 정규화
     */
    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }

        return email.trim().toLowerCase();
    }

    /**
     * 6자리 숫자 인증번호 생성
     */
    private String generateSixDigitCode() {
        int value = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(value);
    }
}