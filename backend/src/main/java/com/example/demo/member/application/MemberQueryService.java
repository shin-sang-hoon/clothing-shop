package com.example.demo.member.application;

import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberQueryService {

    private final MemberRepository memberRepository;
    private final MemberStatusService memberStatusService;

    @Transactional(readOnly = true)
    public String findEmailByNameAndPhoneNumber(String name, String phoneNumber) {
        String normalizedName = normalizeName(name);
        String normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

        Member member = memberRepository.findByNameAndPhoneNumber(normalizedName, normalizedPhoneNumber)
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원을 찾을 수 없습니다."));

        memberStatusService.validateActive(member);
        return member.getEmail();
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
