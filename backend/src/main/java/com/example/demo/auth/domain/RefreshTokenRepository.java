package com.example.demo.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * RefreshTokenRepository
 */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    void deleteByMemberId(Long memberId);
}