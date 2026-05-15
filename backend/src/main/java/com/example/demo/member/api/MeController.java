package com.example.demo.member.api;

import com.example.demo.auth.domain.SocialAccount;
import com.example.demo.auth.domain.SocialAccountRepository;
import com.example.demo.auth.domain.SocialProvider;
import com.example.demo.auth.dto.AuthDtos;
import com.example.demo.member.application.MemberStatusService;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MeController {

    private final MemberRepository memberRepository;
    private final MemberStatusService memberStatusService;
    private final PasswordEncoder passwordEncoder;
    private final SocialAccountRepository socialAccountRepository;

    @GetMapping("/me")
    public ResponseEntity<AuthDtos.UserResponse> me(Authentication authentication) {
        String email = authentication.getName();

        Member member = memberRepository.findWithAuthGraphByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        memberStatusService.validateActive(member);

        Set<String> roles = new LinkedHashSet<>();
        member.getRoles().forEach(role -> roles.add(role.getName()));

        Set<String> permissions = new LinkedHashSet<>();
        member.getRoles().forEach(role ->
                role.getPermissions().forEach(permission -> permissions.add(permission.getCode()))
        );
        member.getDirectPermissions().forEach(permission -> permissions.add(permission.getCode()));

        AuthDtos.UserResponse response = new AuthDtos.UserResponse(
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

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/profile")
    public ResponseEntity<Map<String, String>> getProfile(Authentication authentication) {
        Member member = memberStatusService.getActiveMemberByEmail(authentication.getName());

        java.util.Map<String, String> result = new java.util.LinkedHashMap<>();
        result.put("name", member.getName() != null ? member.getName() : "");
        result.put("nickname", member.getNickname() != null ? member.getNickname() : "");
        result.put("phoneNumber", member.getPhoneNumber() != null ? member.getPhoneNumber() : "");
        result.put("zipCode", member.getZipCode() != null ? member.getZipCode() : "");
        result.put("roadAddress", member.getRoadAddress() != null ? member.getRoadAddress() : "");
        result.put("detailAddress", member.getDetailAddress() != null ? member.getDetailAddress() : "");
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/me/nickname")
    @Transactional
    public ResponseEntity<AuthDtos.MessageResponse> updateNickname(
            Authentication authentication,
            @RequestBody Map<String, String> body
    ) {
        Member member = memberStatusService.getActiveMemberByEmail(authentication.getName());
        String nickname = body.get("nickname");
        if (nickname == null || nickname.isBlank()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }
        String trimmed = nickname.trim();
        if (trimmed.length() < 2 || trimmed.length() > 20) {
            throw new IllegalArgumentException("닉네임은 2자 이상 20자 이하로 입력해주세요.");
        }
        member.setNickname(trimmed);
        memberRepository.save(member);
        return ResponseEntity.ok(new AuthDtos.MessageResponse("닉네임이 저장되었습니다."));
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<Map<String, String>> updateProfile(
            Authentication authentication,
            @RequestBody Map<String, String> body
    ) {
        Member member = memberStatusService.getActiveMemberByEmail(authentication.getName());
        String phoneNumber = body.get("phoneNumber");

        if (phoneNumber != null) {
            String normalizedPhoneNumber = phoneNumber.replaceAll("\\D", "");
            if (!normalizedPhoneNumber.isEmpty() && !normalizedPhoneNumber.matches("\\d{10,11}")) {
                throw new IllegalArgumentException("휴대폰 번호는 숫자 10자리 또는 11자리로 입력해주세요.");
            }
            body.put("phoneNumber", normalizedPhoneNumber);
        }

        if (body.containsKey("name") && body.get("name") != null) {
            member.setName(body.get("name"));
        }
        if (body.containsKey("phoneNumber")) {
            member.setPhoneNumber(body.get("phoneNumber"));
        }
        if (body.containsKey("zipCode")) {
            member.setZipCode(body.get("zipCode"));
        }
        if (body.containsKey("roadAddress")) {
            member.setRoadAddress(body.get("roadAddress"));
        }
        if (body.containsKey("detailAddress")) {
            member.setDetailAddress(body.get("detailAddress"));
        }

        memberRepository.save(member);
        return ResponseEntity.ok(Map.of("message", "프로필이 저장되었습니다."));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<AuthDtos.MessageResponse> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest body
    ) {
        Member member = memberStatusService.getActiveMemberByEmail(authentication.getName());

        if (body.currentPassword == null || body.currentPassword.isBlank()) {
            throw new IllegalArgumentException("현재 비밀번호를 입력해주세요.");
        }
        if (body.newPassword == null || body.newPassword.isBlank()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }
        if (body.confirmPassword == null || !body.newPassword.equals(body.confirmPassword)) {
            throw new IllegalArgumentException("새 비밀번호 확인이 일치하지 않습니다.");
        }
        if (body.newPassword.length() < 8) {
            throw new IllegalArgumentException("새 비밀번호는 8자 이상이어야 합니다.");
        }
        if (!passwordEncoder.matches(body.currentPassword, member.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        member.setPasswordHash(passwordEncoder.encode(body.newPassword));
        memberRepository.save(member);

        return ResponseEntity.ok(new AuthDtos.MessageResponse("비밀번호가 변경되었습니다."));
    }

    @GetMapping("/me/social-accounts")
    public ResponseEntity<List<String>> getLinkedSocialAccounts(Authentication authentication) {
        Member member = memberStatusService.getActiveMemberByEmail(authentication.getName());
        List<String> providers = socialAccountRepository.findAllByMemberId(member.getId())
                .stream()
                .map(SocialAccount::getProvider)
                .map(SocialProvider::name)
                .map(String::toLowerCase)
                .toList();
        return ResponseEntity.ok(providers);
    }

    @Transactional
    @DeleteMapping("/me/social-accounts/{provider}")
    public ResponseEntity<AuthDtos.MessageResponse> unlinkSocialAccount(
            Authentication authentication,
            @PathVariable String provider
    ) {
        Member member = memberStatusService.getActiveMemberByEmail(authentication.getName());
        SocialProvider socialProvider;
        try {
            socialProvider = SocialProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("지원하지 않는 소셜 제공자입니다.");
        }
        if (!socialAccountRepository.existsByMemberIdAndProvider(member.getId(), socialProvider)) {
            throw new IllegalArgumentException("연결되지 않은 소셜 계정입니다.");
        }
        socialAccountRepository.deleteByMemberIdAndProvider(member.getId(), socialProvider);
        return ResponseEntity.ok(new AuthDtos.MessageResponse("소셜 계정 연동이 해제되었습니다."));
    }

    @Getter
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
        private String confirmPassword;
    }
}
