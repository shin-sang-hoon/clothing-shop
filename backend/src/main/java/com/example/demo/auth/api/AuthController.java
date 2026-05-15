package com.example.demo.auth.api;

import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.auth.application.AuthService;
import com.example.demo.auth.application.SocialAccountService;
import com.example.demo.auth.domain.RefreshTokenService;
import com.example.demo.auth.domain.SocialProvider;
import com.example.demo.auth.dto.AuthDtos;
import com.example.demo.auth.verification.application.EmailVerificationService;
import com.example.demo.member.application.MemberQueryService;
import com.example.demo.member.application.MemberStatusService;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final MemberRepository memberRepository;
    private final MemberQueryService memberQueryService;
    private final AuditLogService auditLogService;
    private final SocialAccountService socialAccountService;
    private final EmailVerificationService emailVerificationService;
    private final MemberStatusService memberStatusService;

    @Value("${app.jwt.refresh-days}")
    private long refreshDays;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site}")
    private String cookieSameSite;

    @PostMapping("/email/send-code")
    public ResponseEntity<AuthDtos.MessageResponse> sendEmailCode(
            @Valid @RequestBody AuthDtos.SendEmailCodeRequest req
    ) {
        emailVerificationService.sendSignupVerificationCode(req.email());

        return ResponseEntity.ok(new AuthDtos.MessageResponse("인증번호를 이메일로 전송했습니다."));
    }

    @PostMapping("/email/verify-code")
    public ResponseEntity<AuthDtos.MessageResponse> verifyEmailCode(
            @Valid @RequestBody AuthDtos.VerifyEmailCodeRequest req
    ) {
        emailVerificationService.verifySignupCode(req.email(), req.code());

        return ResponseEntity.ok(new AuthDtos.MessageResponse("이메일 인증이 완료되었습니다."));
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthDtos.MessageResponse> signup(
            @Valid @RequestBody AuthDtos.SignupRequest req,
            HttpServletRequest request
    ) {
        Member member = authService.register(req);
        auditLogService.logMemberSignupSuccess(member.getId(), member.getEmail(), request);

        return ResponseEntity.ok(new AuthDtos.MessageResponse("회원가입이 완료되었습니다."));
    }

    @PostMapping("/find-email")
    public ResponseEntity<AuthDtos.FindEmailResponse> findEmail(
            @Valid @RequestBody AuthDtos.FindEmailRequest req
    ) {
        String email = memberQueryService.findEmailByNameAndPhoneNumber(req.name(), req.phoneNumber());
        return ResponseEntity.ok(new AuthDtos.FindEmailResponse(email));
    }

    @PostMapping("/password/send-reset-code")
    public ResponseEntity<AuthDtos.MessageResponse> sendResetCode(
            @Valid @RequestBody AuthDtos.SendEmailCodeRequest req
    ) {
        emailVerificationService.sendPasswordResetCode(req.email());

        return ResponseEntity.ok(new AuthDtos.MessageResponse("비밀번호 재설정 인증번호를 이메일로 전송했습니다."));
    }

    @PostMapping("/password/verify-reset-code")
    public ResponseEntity<AuthDtos.MessageResponse> verifyResetCode(
            @Valid @RequestBody AuthDtos.VerifyEmailCodeRequest req
    ) {
        emailVerificationService.verifyPasswordResetCode(req.email(), req.code());

        return ResponseEntity.ok(new AuthDtos.MessageResponse("비밀번호 재설정 인증이 완료되었습니다."));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<AuthDtos.MessageResponse> resetPassword(
            @Valid @RequestBody AuthDtos.ResetPasswordRequest req,
            HttpServletRequest request
    ) {
        Member member = authService.resetPassword(req);
        auditLogService.logPasswordResetSuccess(member.getId(), member.getEmail(), request);

        return ResponseEntity.ok(new AuthDtos.MessageResponse("비밀번호가 변경되었습니다."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.LoginResponse> login(
            @Valid @RequestBody AuthDtos.LoginRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        log.info("로그인 요청. email={}", req.email());

        Member member;
        try {
            member = authService.authenticate(req.email(), req.password());
        } catch (IllegalArgumentException ex) {
            if (AuthService.INVALID_CREDENTIALS.equals(ex.getMessage())) {
                auditLogService.logMemberLoginFail(req.email(), "아이디 또는 비밀번호 불일치", request);
            }
            throw ex;
        }

        boolean persistentLogin = Boolean.TRUE.equals(req.rememberMe());

        String refreshRaw = refreshTokenService.issueRefreshToken(member.getId(), persistentLogin);
        String accessToken = authService.issueAccessToken(member);

        setRefreshCookie(response, refreshRaw, persistentLogin);

        auditLogService.logMemberLoginSuccess(member.getId(), member.getEmail(), request);

        log.info(
                "로그인 성공. memberId={}, email={}, persistentLogin={}",
                member.getId(),
                member.getEmail(),
                persistentLogin
        );

        return ResponseEntity.ok(new AuthDtos.LoginResponse(accessToken, buildUserResponse(member)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthDtos.RefreshResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshRaw,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (refreshRaw == null || refreshRaw.isBlank()) {
            return ResponseEntity.noContent().build();
        }

        RefreshTokenService.RefreshRotationResult rotationResult = refreshTokenService.rotate(refreshRaw);

        Long memberId = rotationResult.memberId();
        String newRefreshRaw = rotationResult.newRefreshRaw();
        boolean persistentLogin = rotationResult.persistentLogin();

        Member member = memberRepository.findWithAuthGraphById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("MEMBER_NOT_FOUND"));

        memberStatusService.validateActive(member);

        String newAccessToken = authService.issueAccessToken(member);

        setRefreshCookie(response, newRefreshRaw, persistentLogin);
        auditLogService.logTokenRefreshSuccess(member.getId(), member.getEmail(), request);

        log.info(
                "토큰 재발급 성공. memberId={}, ip={}, persistentLogin={}",
                memberId,
                request.getRemoteAddr(),
                persistentLogin
        );

        return ResponseEntity.ok(new AuthDtos.RefreshResponse(newAccessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshRaw,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (refreshRaw != null && !refreshRaw.isBlank()) {
            refreshTokenService.revokeByRawToken(refreshRaw);
        }

        clearRefreshCookie(response);
        auditLogService.logCurrentActorAction(
                AuditCategory.MEMBER,
                AuditEventType.LOGOUT,
                "회원 로그아웃 성공",
                request
        );

        log.info("로그아웃 완료");
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/social/connect")
    public ResponseEntity<AuthDtos.LoginResponse> connectSocial(
            @Valid @RequestBody AuthDtos.SocialConnectRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        Member member;
        try {
            member = authService.authenticate(req.email(), req.password());
        } catch (IllegalArgumentException ex) {
            if (AuthService.INVALID_CREDENTIALS.equals(ex.getMessage())) {
                auditLogService.logMemberLoginFail(req.email(), "소셜 계정 연결 전 로그인 검증 실패", request);
            }
            throw ex;
        }

        SocialProvider provider;
        try {
            provider = socialAccountService.parseProvider(req.provider());
        } catch (Exception exception) {
            throw new IllegalArgumentException("지원하지 않는 소셜 제공자입니다.");
        }

        socialAccountService.connectSocialAccountToMember(
                member,
                provider,
                req.providerUserId(),
                req.socialEmail()
        );

        boolean persistentLogin = false;
        String refreshRaw = refreshTokenService.issueRefreshToken(member.getId(), persistentLogin);
        String accessToken = authService.issueAccessToken(member);

        setRefreshCookie(response, refreshRaw, persistentLogin);

        auditLogService.logSocialConnectSuccess(
                member.getId(),
                member.getEmail(),
                provider.name(),
                request
        );
        auditLogService.logMemberLoginSuccess(member.getId(), member.getEmail(), request);

        log.info(
                "소셜 계정 연결 및 로그인 완료. memberId={}, email={}, provider={}",
                member.getId(),
                member.getEmail(),
                provider
        );

        return ResponseEntity.ok(new AuthDtos.LoginResponse(accessToken, buildUserResponse(member)));
    }

    private AuthDtos.UserResponse buildUserResponse(Member member) {
        Set<String> roles = member.getRoles()
                .stream()
                .map(role -> role.getName())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<String> permissions = new LinkedHashSet<>();
        member.getRoles().forEach(role ->
                role.getPermissions().forEach(permission -> permissions.add(permission.getCode()))
        );
        member.getDirectPermissions().forEach(permission -> permissions.add(permission.getCode()));

        return new AuthDtos.UserResponse(
                member.getId(),
                member.getName(),
                member.getNickname(),
                member.getEmail(),
                member.getPhoneNumber(),
                member.getZipCode(),
                member.getRoadAddress(),
                member.getDetailAddress(),
                roles,
                permissions
        );
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

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie
                .from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(cookieSameSite)
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
}
