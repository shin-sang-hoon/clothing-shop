package com.example.demo.admin.assignment.api;

import com.example.demo.admin.assignment.application.AdminAssignmentService;
import com.example.demo.admin.assignment.dto.AssignmentDtos;
import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AdminAssignmentController
 * - 사용자(Role/Permission) 할당도 전부 Permission으로 통제
 */
@RestController
@RequestMapping("/api/admin/assignments")
@RequiredArgsConstructor
public class AdminAssignmentController {

    private final AdminAssignmentService adminAssignmentService;
    private final AuditLogService auditLogService;

    @GetMapping("/members")
    @PreAuthorize("hasAuthority('PERM_MEMBER_READ')")
    public List<AssignmentDtos.MemberSummary> listMembers() {
        return adminAssignmentService.listMembers();
    }

    @PutMapping("/members/{memberId}/roles")
    @PreAuthorize("hasAuthority('PERM_MEMBER_SET_ROLES')")
    public ResponseEntity<AssignmentDtos.MemberSummary> setRoles(@PathVariable Long memberId,
            @Valid @RequestBody AssignmentDtos.SetMemberRolesRequest req,
            HttpServletRequest request) {
        AssignmentDtos.MemberSummary response = adminAssignmentService.setMemberRoles(memberId, req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.MEMBER_ROLE_UPDATE,
                "회원 역할 변경: memberId=" + memberId + ", roles=" + req.roleIds().size(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/members/{memberId}/permissions")
    @PreAuthorize("hasAuthority('PERM_MEMBER_SET_PERMISSIONS')")
    public ResponseEntity<AssignmentDtos.MemberSummary> setDirectPermissions(@PathVariable Long memberId,
            @Valid @RequestBody AssignmentDtos.SetMemberDirectPermissionsRequest req,
            HttpServletRequest request) {
        AssignmentDtos.MemberSummary response = adminAssignmentService.setMemberDirectPermissions(memberId, req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.MEMBER_PERMISSION_UPDATE,
                "회원 개별 권한 변경: memberId=" + memberId + ", permissions=" + req.permissionIds().size(), request);
        return ResponseEntity.ok(response);
    }
}
