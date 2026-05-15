package com.example.demo.auth.verification.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * EmailVerificationRepository
 * - 이메일 인증 이력 조회
 */
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    /**
     * 특정 이메일 + 목적의 가장 최근 인증 요청 조회
     */
    Optional<EmailVerification> findTopByEmailAndPurposeOrderByIdDesc(
            String email,
            VerificationPurpose purpose
    );

    /**
     * 특정 이메일 + 목적의 가장 최근 인증 완료 이력 조회
     */
    Optional<EmailVerification> findTopByEmailAndPurposeAndVerifiedAtIsNotNullOrderByIdDesc(
            String email,
            VerificationPurpose purpose
    );

    /**
     * 특정 이메일 + 목적의 인증 이력 삭제
     * - 비밀번호 재설정 완료 후 사용
     */
    void deleteByEmailAndPurpose(String email, VerificationPurpose purpose);
}