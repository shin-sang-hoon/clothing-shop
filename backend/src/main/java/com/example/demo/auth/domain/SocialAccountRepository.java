package com.example.demo.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * SocialAccountRepository
 */
public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {

    /**
     * provider + providerUserId 기준 조회
     */
    Optional<SocialAccount> findByProviderAndProviderUserId(
            SocialProvider provider,
            String providerUserId
    );

    /**
     * 특정 회원의 모든 소셜 계정 조회
     */
    List<SocialAccount> findAllByMemberId(Long memberId);

    /**
     * 특정 회원에 특정 provider 연결 여부 확인
     */
    boolean existsByMemberIdAndProvider(Long memberId, SocialProvider provider);

    /**
     * 특정 회원의 특정 provider 소셜 계정 삭제
     */
    void deleteByMemberIdAndProvider(Long memberId, SocialProvider provider);
}