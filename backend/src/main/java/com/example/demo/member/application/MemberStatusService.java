package com.example.demo.member.application;

import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import com.example.demo.member.domain.MemberStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberStatusService {

    public static final String MEMBER_BLOCKED = "MEMBER_BLOCKED";
    public static final String MEMBER_WITHDRAWN = "MEMBER_WITHDRAWN";

    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public Member getActiveMemberByEmail(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        validateActive(member);
        return member;
    }

    public void validateActive(Member member) {
        if (member.getStatus() == MemberStatus.BLOCKED) {
            throw new IllegalArgumentException(MEMBER_BLOCKED);
        }

        if (member.getStatus() == MemberStatus.WITHDRAWN) {
            throw new IllegalArgumentException(MEMBER_WITHDRAWN);
        }
    }
}
