package com.example.demo.admin.role.api;

import com.example.demo.admin.role.application.AdminRoleService;
import com.example.demo.admin.role.dto.RoleDtos;
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
 * AdminRoleController
 * - Role 관리도 전부 Permission으로 통제
 */
@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
public class AdminRoleController {

    private final AdminRoleService adminRoleService;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_ROLE_READ')")
    public List<RoleDtos.RoleResponse> list() {
        return adminRoleService.list();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_ROLE_CREATE')")
    public ResponseEntity<RoleDtos.RoleResponse> create(
            @Valid @RequestBody RoleDtos.CreateRoleRequest req,
            HttpServletRequest request
    ) {
        RoleDtos.RoleResponse response = adminRoleService.create(req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.ROLE_CREATE,
                "역할 생성: " + response.name(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_ROLE_UPDATE')")
    public ResponseEntity<RoleDtos.RoleResponse> update(@PathVariable Long id,
            @Valid @RequestBody RoleDtos.UpdateRoleRequest req,
            HttpServletRequest request) {
        RoleDtos.RoleResponse response = adminRoleService.update(id, req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.ROLE_UPDATE,
                "역할 수정: id=" + id + ", name=" + response.name(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_ROLE_DELETE')")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        adminRoleService.delete(id);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.ROLE_DELETE,
                "역할 삭제: id=" + id, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('PERM_ROLE_SET_PERMISSIONS')")
    public ResponseEntity<RoleDtos.RoleResponse> setPermissions(@PathVariable Long id,
            @Valid @RequestBody RoleDtos.UpdateRolePermissionsRequest req,
            HttpServletRequest request) {
        RoleDtos.RoleResponse response = adminRoleService.setRolePermissions(id, req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.ROLE_PERMISSION_UPDATE,
                "역할 권한 변경: id=" + id + ", permissions=" + req.permissionIds().size(), request);
        return ResponseEntity.ok(response);
    }
}
