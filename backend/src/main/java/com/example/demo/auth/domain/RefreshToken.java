package com.example.demo.auth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * RefreshToken
 * - refresh token 회전/무효화 관리용
 * - token "원문"은 저장하지 않고, SHA-256 해시만 저장
 * - persistent:
 * true  -> 로그인 유지 선택
 * false -> 세션 로그인(브라우저 종료 시 쿠키 제거)
 */
@Entity
@Table(name = "refresh_token",
        indexes = {
                @Index(name = "idx_refresh_token_hash", columnList = "tokenHash", unique = true),
                @Index(name = "idx_refresh_token_member", columnList = "memberId")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 사용자 FK
     * - MVP 구조라 단순 Long 사용
     */
    @Column(nullable = false)
    private Long memberId;

    /**
     * refresh token 원문이 아니라 해시 저장
     */
    @Column(nullable = false, length = 64, unique = true)
    private String tokenHash;

    /**
     * 만료 시각
     */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 회전 이후 기존 토큰 무효화 여부
     */
    @Column(nullable = false)
    private boolean revoked = false;

    /**
     * 로그인 유지 여부
     * - true  : 지속 로그인
     * - false : 세션 로그인
     * <p>
     * 주의:
     * - 기존 DB 마이그레이션 충돌을 줄이기 위해 DEFAULT 0 지정
     */
    @Column(nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean persistent = false;

    /**
     * 생성 시각
     */
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}