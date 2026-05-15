package com.example.demo.admin.assignment.application;

import com.example.demo.admin.assignment.dto.AssignmentDtos;
import com.example.demo.admin.permission.domain.Permission;
import com.example.demo.admin.permission.domain.PermissionRepository;
import com.example.demo.admin.role.domain.Role;
import com.example.demo.admin.role.domain.RoleRepository;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * AdminAssignmentService
 * - 사용자에게 Role / Direct Permission 할당
 *
 * 정책:
 * - roleIds는 최종 상태로 보고 member.roles를 set으로 덮어씀
 * - permissionIds도 최종 상태로 보고 member.directPermissions를 set으로 덮어씀
 */
@Service
@RequiredArgsConstructor
public class AdminAssignmentService {

    private final MemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<AssignmentDtos.MemberSummary> listMembers() {
        return memberRepository.findAll().stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public AssignmentDtos.MemberSummary setMemberRoles(Long memberId, AssignmentDtos.SetMemberRolesRequest req) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        List<Role> roles = roleRepository.findAllById(req.roleIds());
        if (roles.size() != req.roleIds().size()) {
            throw new IllegalArgumentException("Some roles not found");
        }

        member.getRoles().clear();
        member.getRoles().addAll(roles);

        return toSummary(member);
    }

    @Transactional
    public AssignmentDtos.MemberSummary setMemberDirectPermissions(Long memberId,
            AssignmentDtos.SetMemberDirectPermissionsRequest req) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        List<Permission> perms = permissionRepository.findAllById(req.permissionIds());
        if (perms.size() != req.permissionIds().size()) {
            throw new IllegalArgumentException("Some permissions not found");
        }

        member.getDirectPermissions().clear();
        member.getDirectPermissions().addAll(perms);

        return toSummary(member);
    }

    private AssignmentDtos.MemberSummary toSummary(Member member) {
        List<String> roles = member.getRoles().stream().map(Role::getName).toList();

        // ✅ 최종 permissions(롤 + direct)도 같이 내려주면 관리 UI에서 편함
        Set<String> permCodes = new LinkedHashSet<>();
        for (Role role : member.getRoles()) {
            for (Permission p : role.getPermissions())
                permCodes.add(p.getCode());
        }
        for (Permission p : member.getDirectPermissions())
            permCodes.add(p.getCode());

        return new AssignmentDtos.MemberSummary(member.getId(), member.getEmail(), roles, permCodes.stream().toList());
    }
}