package com.example.demo.auth.application;

import com.example.demo.auth.domain.SocialAccount;
import com.example.demo.auth.domain.SocialAccountRepository;
import com.example.demo.auth.domain.SocialProvider;
import com.example.demo.auth.dto.SocialProfile;
import com.example.demo.member.domain.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SocialAccountService
 * - 소셜 계정 조회 및 기존 회원 연결 처리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SocialAccountService {

    public static final String SOCIAL_ALREADY_LINKED = "SOCIAL_ALREADY_LINKED";
    public static final String MEMBER_ALREADY_HAS_PROVIDER = "MEMBER_ALREADY_HAS_PROVIDER";

    private final SocialAccountRepository socialAccountRepository;

    /**
     * 이미 연결된 소셜 계정이면 member 반환
     * - 없으면 null
     */
    @Transactional(readOnly = true)
    public Member findConnectedMember(SocialProfile profile) {
        return socialAccountRepository
                .findByProviderAndProviderUserId(profile.provider(), profile.providerUserId())
                .map(SocialAccount::getMember)
                .orElse(null);
    }

    /**
     * 기존 회원에 소셜 계정 연결
     * - 이메일/비밀번호 검증은 AuthService에서 선행
     * - 같은 소셜은 중복 연결 불가
     * - 같은 회원에 같은 provider 중복 연결 불가
     * - socialEmail은 저장 참고값일 뿐, member.email 과 비교하지 않음
     */
    @Transactional
    public void connectSocialAccountToMember(
            Member member,
            SocialProvider provider,
            String providerUserId,
            String socialEmail
    ) {
        String normalizedSocialEmail = normalizeBlank(socialEmail);

        if (socialAccountRepository.findByProviderAndProviderUserId(provider, providerUserId).isPresent()) {
            throw new IllegalArgumentException(SOCIAL_ALREADY_LINKED);
        }

        if (socialAccountRepository.existsByMemberIdAndProvider(member.getId(), provider)) {
            throw new IllegalArgumentException(MEMBER_ALREADY_HAS_PROVIDER);
        }

        SocialAccount socialAccount = new SocialAccount(
                member,
                provider,
                providerUserId,
                normalizedSocialEmail
        );

        socialAccountRepository.save(socialAccount);

        log.info(
                "기존 회원 소셜 계정 연결 완료. memberId={}, email={}, provider={}, providerUserId={}",
                member.getId(),
                member.getEmail(),
                provider,
                providerUserId
        );
    }

    /**
     * 문자열 provider -> enum 변환
     */
    public SocialProvider parseProvider(String provider) {
        return SocialProvider.valueOf(provider.toUpperCase());
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }
}