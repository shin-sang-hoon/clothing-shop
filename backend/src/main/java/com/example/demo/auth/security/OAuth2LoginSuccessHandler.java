package com.example.demo.auth.security;

import com.example.demo.auth.application.AuthService;
import com.example.demo.auth.application.CustomOAuth2UserService;
import com.example.demo.auth.application.SocialAccountService;
import com.example.demo.auth.domain.RefreshTokenService;
import com.example.demo.auth.dto.SocialProfile;
import com.example.demo.member.application.MemberStatusService;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final String OAUTH_REMEMBER_ME_COOKIE = "oauth_remember_me";
    private static final String SOCIAL_CONNECT_MODE_COOKIE = "social_connect_mode";
    private static final String ADMIN_PORTAL_PERMISSION = "PERM_ADMIN_PORTAL_ACCESS";
    private static final String REASON_SOCIAL_ALREADY_LINKED = "social_already_linked";
    private static final String REASON_MEMBER_ALREADY_HAS_PROVIDER = "member_already_has_provider";
    private static final String REASON_NOT_AUTHENTICATED = "not_authenticated";
    private static final String REASON_MEMBER_NOT_FOUND = "member_not_found";
    private static final String REASON_UNKNOWN = "unknown";

    private final CustomOAuth2UserService customOAuth2UserService;
    private final SocialAccountService socialAccountService;
    private final RefreshTokenService refreshTokenService;
    private final MemberRepository memberRepository;
    private final AuthService authService;
    private final MemberStatusService memberStatusService;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site}")
    private String cookieSameSite;

    @Value("${app.jwt.refresh-days}")
    private long refreshDays;

    @Value("${app.frontend-url:http://localhost}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();

        SocialProfile profile;
        try {
            profile = customOAuth2UserService.extractProfile(
                    oauthToken.getAuthorizedClientRegistrationId(),
                    oAuth2User
            );
        } catch (Exception ex) {
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=oauth");
            return;
        }

        if (profile.providerUserId() == null || profile.providerUserId().isBlank()) {
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=oauth");
            return;
        }

        boolean persistentLogin = resolveRememberMe(request);
        clearRememberMeCookie(response);

        boolean socialConnectMode = isSocialConnectMode(request);

        if (socialConnectMode) {
            clearSocialConnectModeCookie(response);

            String refreshRaw = readCookieValue(request, REFRESH_COOKIE_NAME);
            Long memberId = refreshTokenService.findValidTokenInfo(refreshRaw)
                    .map(RefreshTokenService.ValidRefreshTokenInfo::memberId)
                    .orElse(null);

            if (memberId == null) {
                redirectSocialConnectFailed(
                        request,
                        response,
                        oauthToken.getAuthorizedClientRegistrationId(),
                        REASON_NOT_AUTHENTICATED
                );
                return;
            }

            Member currentMember = memberRepository.findWithAuthGraphById(memberId)
                    .orElse(null);

            if (currentMember == null) {
                redirectSocialConnectFailed(
                        request,
                        response,
                        oauthToken.getAuthorizedClientRegistrationId(),
                        REASON_MEMBER_NOT_FOUND
                );
                return;
            }

            try {
                memberStatusService.validateActive(currentMember);
                socialAccountService.connectSocialAccountToMember(
                        currentMember,
                        profile.provider(),
                        profile.providerUserId(),
                        profile.email()
                );
            } catch (IllegalArgumentException ex) {
                redirectSocialConnectFailed(
                        request,
                        response,
                        oauthToken.getAuthorizedClientRegistrationId(),
                        resolveSocialConnectFailureReason(ex)
                );
                return;
            } catch (Exception ex) {
                redirectSocialConnectFailed(
                        request,
                        response,
                        oauthToken.getAuthorizedClientRegistrationId(),
                        REASON_UNKNOWN
                );
                return;
            }

            String redirectUrl = frontendUrl + "/login"
                    + "?socialConnect=success"
                    + "&provider=" + encode(oauthToken.getAuthorizedClientRegistrationId());
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            return;
        }

        Member connectedMember = socialAccountService.findConnectedMember(profile);

        if (connectedMember != null) {
            Member loadedMember = memberRepository.findWithAuthGraphById(connectedMember.getId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "회원을 찾을 수 없습니다. id=" + connectedMember.getId()
                    ));

            memberStatusService.validateActive(loadedMember);

            String refreshRaw = refreshTokenService.issueRefreshToken(
                    loadedMember.getId(),
                    persistentLogin
            );

            setRefreshCookie(response, refreshRaw, persistentLogin);

            String accessToken = authService.issueAccessToken(loadedMember);
            String redirectPath = hasAdminPortalPermission(loadedMember) ? "/admin" : "/";
            String redirectUrl = frontendUrl + redirectPath + "?accessToken=" + encode(accessToken);

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            return;
        }

        String redirectUrl = frontendUrl + "/login"
                + "?socialStatus=required"
                + "&provider=" + encode(oauthToken.getAuthorizedClientRegistrationId())
                + "&email=" + encode(profile.email())
                + "&providerUserId=" + encode(profile.providerUserId());

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private void redirectSocialConnectFailed(
            HttpServletRequest request,
            HttpServletResponse response,
            String provider
    ) throws IOException {
        redirectSocialConnectFailed(request, response, provider, null);
    }

    private void redirectSocialConnectFailed(
            HttpServletRequest request,
            HttpServletResponse response,
            String provider,
            String reason
    ) throws IOException {
        String redirectUrl = frontendUrl + "/login"
                + "?socialConnect=failed"
                + "&provider=" + encode(provider);
        if (reason != null && !reason.isBlank()) {
            redirectUrl += "&reason=" + encode(reason);
        }
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private String resolveSocialConnectFailureReason(IllegalArgumentException ex) {
        if (SocialAccountService.SOCIAL_ALREADY_LINKED.equals(ex.getMessage())) {
            return REASON_SOCIAL_ALREADY_LINKED;
        }
        if (SocialAccountService.MEMBER_ALREADY_HAS_PROVIDER.equals(ex.getMessage())) {
            return REASON_MEMBER_ALREADY_HAS_PROVIDER;
        }
        return REASON_UNKNOWN;
    }

    private boolean hasAdminPortalPermission(Member member) {
        if (member.getRoles() != null) {
            for (var role : member.getRoles()) {
                if (role.getPermissions() == null) {
                    continue;
                }

                for (var permission : role.getPermissions()) {
                    if (ADMIN_PORTAL_PERMISSION.equals(permission.getCode())) {
                        return true;
                    }
                }
            }
        }

        if (member.getDirectPermissions() != null) {
            for (var permission : member.getDirectPermissions()) {
                if (ADMIN_PORTAL_PERMISSION.equals(permission.getCode())) {
                    return true;
                }
            }
        }

        return false;
    }

    private boolean resolveRememberMe(HttpServletRequest request) {
        String value = readCookieValue(request, OAUTH_REMEMBER_ME_COOKIE);
        return "1".equals(value);
    }

    private boolean isSocialConnectMode(HttpServletRequest request) {
        return "1".equals(readCookieValue(request, SOCIAL_CONNECT_MODE_COOKIE));
    }

    private String readCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();

        if (cookies == null || cookies.length == 0) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }

    private void clearRememberMeCookie(HttpServletResponse response) {
        clearCookie(response, OAUTH_REMEMBER_ME_COOKIE);
    }

    private void clearSocialConnectModeCookie(HttpServletResponse response) {
        clearCookie(response, SOCIAL_CONNECT_MODE_COOKIE);
    }

    private void clearCookie(HttpServletResponse response, String cookieName) {
        ResponseCookie cookie = ResponseCookie
                .from(cookieName, "")
                .path("/")
                .sameSite(cookieSameSite)
                .secure(cookieSecure)
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private void setRefreshCookie(
            HttpServletResponse response,
            String refreshRaw,
            boolean persistentLogin
    ) {
        ResponseCookie.ResponseCookieBuilder cookieBuilder = ResponseCookie
                .from(REFRESH_COOKIE_NAME, refreshRaw)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(cookieSameSite);

        if (persistentLogin) {
            cookieBuilder.maxAge(Duration.ofDays(refreshDays));
        }

        response.addHeader("Set-Cookie", cookieBuilder.build().toString());
    }
}
