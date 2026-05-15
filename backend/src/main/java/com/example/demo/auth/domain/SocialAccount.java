package com.example.demo.auth.domain;

import com.example.demo.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * SocialAccount
 * - member와 소셜 계정을 연결하는 테이블
 * - member 1 : social_account N
 */
@Entity
@Table(
        name = "social_account",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_social_provider_user",
                        columnNames = {"provider", "provider_user_id"}
                )
        },
        indexes = {
                @Index(name = "idx_social_member_id", columnList = "member_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 연결된 회원
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    /**
     * 소셜 제공자
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 30)
    private SocialProvider provider;

    /**
     * 소셜 제공자 내 고유 사용자 ID
     */
    @Column(name = "provider_user_id", nullable = false, length = 190)
    private String providerUserId;

    /**
     * provider에서 내려준 이메일
     */
    @Column(name = "provider_email", length = 255)
    private String providerEmail;

    /**
     * 생성일시
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public SocialAccount(
            Member member,
            SocialProvider provider,
            String providerUserId,
            String providerEmail
    ) {
        this.member = member;
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.providerEmail = providerEmail;
    }
}