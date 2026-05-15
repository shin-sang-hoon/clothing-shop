package com.example.demo.auth.application;

import com.example.demo.admin.role.domain.RoleRepository;
import com.example.demo.auth.dto.AuthDtos;
import com.example.demo.auth.verification.application.EmailVerificationService;
import com.example.demo.global.security.JwtUtil;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.application.MemberStatusService;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import com.example.demo.member.domain.MemberStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String INVALID_CREDENTIALS = "INVALID_CREDENTIALS";

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailVerificationService emailVerificationService;
    private final RoleRepository roleRepository;
    private final MemberStatusService memberStatusService;

    @Transactional
    public Member authenticate(String email, String password) {
        String normalizedEmail = normalizeEmail(email);

        Member member = memberRepository.findWithAuthGraphByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    log.warn("Login failed - email not found. email={}", normalizedEmail);
                    return new IllegalArgumentException(INVALID_CREDENTIALS);
                });

        memberStatusService.validateActive(member);

        if (!passwordEncoder.matches(password, member.getPasswordHash())) {
            log.warn("Login failed - password mismatch. email={}, memberId={}", normalizedEmail, member.getId());
            throw new IllegalArgumentException(INVALID_CREDENTIALS);
        }

        member.setLastLoginAt(ApiDateTimeConverter.nowKst());

        log.info("Login success. email={}, memberId={}", normalizedEmail, member.getId());
        return member;
    }

    @Transactional
    public Member register(AuthDtos.SignupRequest req) {
        String normalizedName = normalizeName(req.name());
        String normalizedPhoneNumber = normalizePhoneNumber(req.phoneNumber());
        String normalizedEmail = normalizeEmail(req.email());

        if (memberRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        if (!emailVerificationService.isSignupVerified(normalizedEmail)) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        Member member = new Member();
        member.setName(normalizedName);
        member.setNickname(req.nickname() != null ? req.nickname().trim() : null);
        member.setPhoneNumber(normalizedPhoneNumber);
        member.setEmail(normalizedEmail);
        member.setPasswordHash(passwordEncoder.encode(req.password()));
        member.setEmailVerified(true);
        member.setEmailVerifiedAt(ApiDateTimeConverter.nowKst());
        member.setStatus(MemberStatus.NORMAL);
        member.setPoint(0);

        roleRepository.findByName("ROLE_USER")
                .ifPresent(role -> member.getRoles().add(role));

        Member savedMember = memberRepository.save(member);

        log.info("Signup complete. memberId={}, email={}", savedMember.getId(), savedMember.getEmail());
        return savedMember;
    }

    @Transactional
    public Member resetPassword(AuthDtos.ResetPasswordRequest req) {
        String normalizedEmail = normalizeEmail(req.email());

        if (!emailVerificationService.canResetPassword(normalizedEmail)) {
            throw new IllegalArgumentException("비밀번호 재설정 인증이 완료되지 않았습니다.");
        }

        Member member = memberRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("가입한 이메일을 찾을 수 없습니다."));

        memberStatusService.validateActive(member);
        member.setPasswordHash(passwordEncoder.encode(req.newPassword()));

        emailVerificationService.clearPasswordResetVerification(normalizedEmail);

        log.info("Password reset complete. memberId={}, email={}", member.getId(), member.getEmail());
        return member;
    }

    @Transactional(readOnly = true)
    public String issueAccessToken(Member member) {
        Member loadedMember = memberRepository.findWithAuthGraphById(member.getId())
                .orElseThrow(() -> {
                    log.error("Access token issue failed - member lookup failed. memberId={}", member.getId());
                    return new EntityNotFoundException("회원을 찾을 수 없습니다. id=" + member.getId());
                });

        memberStatusService.validateActive(loadedMember);

        log.info("Access token issued. memberId={}", loadedMember.getId());
        return jwtUtil.createAccessToken(loadedMember);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return "";
        }
        return phoneNumber.replaceAll("[^0-9]", "");
    }
}
