package com.example.demo.global.security;

import com.example.demo.admin.permission.domain.Permission;
import com.example.demo.admin.role.domain.Role;
import com.example.demo.member.application.MemberStatusService;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class MemberAuthorityResolver {

    private final MemberRepository memberRepository;
    private final MemberStatusService memberStatusService;

    @Transactional(readOnly = true)
    public ResolvedMember resolveActiveMember(Long memberId) {
        Member member = memberRepository.findWithAuthGraphById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));

        memberStatusService.validateActive(member);

        Set<String> permissionCodes = new LinkedHashSet<>();
        for (Role role : member.getRoles()) {
            for (Permission permission : role.getPermissions()) {
                permissionCodes.add(permission.getCode());
            }
        }
        for (Permission permission : member.getDirectPermissions()) {
            permissionCodes.add(permission.getCode());
        }

        List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
        // 역할 추가 (ROLE_ 접두사 포함, hasRole() 에서 사용)
        for (Role role : member.getRoles()) {
            authorities.add(new SimpleGrantedAuthority(role.getName()));
        }
        // 권한 코드 추가
        for (String perm : permissionCodes) {
            authorities.add(new SimpleGrantedAuthority(perm));
        }

        return new ResolvedMember(member.getEmail(), authorities);
    }

    public record ResolvedMember(
            String email,
            List<SimpleGrantedAuthority> authorities
    ) {
    }
}
