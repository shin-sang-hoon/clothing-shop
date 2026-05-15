package com.example.demo.auth.dto;

import com.example.demo.auth.domain.SocialProvider;

/**
 * SocialProfile
 * - provider별 응답을 공통 형식으로 정규화한 DTO
 */
public record SocialProfile(
        SocialProvider provider,
        String providerUserId,
        String email,
        String name
) {
}