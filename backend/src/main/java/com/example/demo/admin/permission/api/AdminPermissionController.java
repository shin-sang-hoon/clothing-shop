package com.example.demo.admin.permission.api;

import com.example.demo.admin.permission.application.AdminPermissionService;
import com.example.demo.admin.permission.dto.PermissionDtos;
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
 * AdminPermissionController
 * - 관리자 영역 진입은 SecurityConfig에서 PERM_ADMIN_PORTAL_ACCESS로 1차 보호
 * - Permission CRUD는 여기서 세부 Permission으로 추가 보호
 */
@RestController
@RequestMapping("/api/admin/permissions")
@RequiredArgsConstructor
public class AdminPermissionController {

    private final AdminPermissionService adminPermissionService;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PERMISSION_READ')")
    public List<PermissionDtos.PermissionResponse> list() {
        return adminPermissionService.list();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_PERMISSION_CREATE')")
    public ResponseEntity<PermissionDtos.PermissionResponse> create(
            @Valid @RequestBody PermissionDtos.CreatePermissionRequest req,
            HttpServletRequest request) {
        PermissionDtos.PermissionResponse response = adminPermissionService.create(req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.PERMISSION_CREATE,
                "권한 생성: " + response.code(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PERMISSION_UPDATE')")
    public ResponseEntity<PermissionDtos.PermissionResponse> update(@PathVariable Long id,
            @Valid @RequestBody PermissionDtos.UpdatePermissionRequest req,
            HttpServletRequest request) {
        PermissionDtos.PermissionResponse response = adminPermissionService.update(id, req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.PERMISSION_UPDATE,
                "권한 수정: id=" + id + ", code=" + response.code(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PERMISSION_DELETE')")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        adminPermissionService.delete(id);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.PERMISSION_DELETE,
                "권한 삭제: id=" + id, request);
        return ResponseEntity.ok().build();
    }
}
