package com.example.demo.auth.verification.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * EmailVerification
 * - 이메일 인증 이력
 * - 인증번호 원문은 저장하지 않고 해시만 저장
 * - purpose로 회원가입 / 비밀번호 재설정 구분
 */
@Entity
@Table(
        name = "email_verification",
        indexes = {
                @Index(name = "idx_email_verification_email", columnList = "email"),
                @Index(name = "idx_email_verification_email_purpose", columnList = "email,purpose")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 인증 대상 이메일
     */
    @Column(nullable = false, length = 190)
    private String email;

    /**
     * 인증 목적
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VerificationPurpose purpose;

    /**
     * 인증번호 해시
     */
    @Column(nullable = false, length = 255)
    private String codeHash;

    /**
     * 만료 시각
     */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 인증 완료 시각
     * - null 이면 미인증
     */
    @Column
    private LocalDateTime verifiedAt;

    /**
     * 생성 시각
     */
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}