package com.example.demo.auth.application;

import com.example.demo.auth.domain.SocialProvider;
import com.example.demo.auth.dto.SocialProfile;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * CustomOAuth2UserService
 * - provider별 사용자 정보를 SocialProfile로 정규화
 * - 주의:
 *   1) OAuth2 attribute는 제네릭 반환이므로 String.valueOf(...) 직접 호출하지 않음
 *   2) email은 provider 정책상 안 내려올 수 있으므로 optional 처리
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        return super.loadUser(userRequest);
    }

    /**
     * registrationId + OAuth2User 기준 프로필 추출
     */
    public SocialProfile extractProfile(String registrationId, OAuth2User oAuth2User) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> extractGoogle(oAuth2User);
            case "kakao" -> extractKakao(oAuth2User);
            case "naver" -> extractNaver(oAuth2User);
            default -> throw new IllegalArgumentException(
                    "지원하지 않는 소셜 provider 입니다. registrationId=" + registrationId
            );
        };
    }

    /**
     * Google 프로필 추출
     * - sub: provider user id
     * - email: 없을 가능성은 낮지만 optional 처리
     */
    private SocialProfile extractGoogle(OAuth2User oAuth2User) {
        String providerUserId = toStringValue(oAuth2User.getAttribute("sub"));
        String email = normalizeBlank(toStringValue(oAuth2User.getAttribute("email")));
        String name = normalizeBlank(toStringValue(oAuth2User.getAttribute("name")));

        return new SocialProfile(
                SocialProvider.GOOGLE,
                providerUserId,
                email,
                name
        );
    }

    /**
     * Kakao 프로필 추출
     * - email은 동의항목/계정 상태에 따라 없을 수 있음
     */
    @SuppressWarnings("unchecked")
    private SocialProfile extractKakao(OAuth2User oAuth2User) {
        String providerUserId = toStringValue(oAuth2User.getAttribute("id"));

        Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttribute("kakao_account");
        Map<String, Object> profile = kakaoAccount == null
                ? null
                : (Map<String, Object>) kakaoAccount.get("profile");

        String email = kakaoAccount == null ? null : normalizeBlank(toStringValue(kakaoAccount.get("email")));
        String name = profile == null ? null : normalizeBlank(toStringValue(profile.get("nickname")));

        return new SocialProfile(
                SocialProvider.KAKAO,
                providerUserId,
                email,
                name
        );
    }

    /**
     * Naver 프로필 추출
     * - email은 정책/동의항목에 따라 없을 수 있음
     */
    @SuppressWarnings("unchecked")
    private SocialProfile extractNaver(OAuth2User oAuth2User) {
        Map<String, Object> response = (Map<String, Object>) oAuth2User.getAttribute("response");

        String providerUserId = response == null ? null : toStringValue(response.get("id"));
        String email = response == null ? null : normalizeBlank(toStringValue(response.get("email")));
        String name = response == null ? null : normalizeBlank(toStringValue(response.get("name")));

        return new SocialProfile(
                SocialProvider.NAVER,
                providerUserId,
                email,
                name
        );
    }

    /**
     * null-safe 문자열 변환
     */
    private String toStringValue(Object value) {
        return value == null ? null : value.toString();
    }

    /**
     * 빈 문자열은 null로 정규화
     * - provider가 "" 를 줄 수도 있으므로 optional 필드에서 null 취급
     */
    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }
}