package com.example.demo.admin.member.api;

import com.example.demo.admin.member.application.AdminMemberService;
import com.example.demo.admin.member.dto.AdminMemberDtos;
import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AdminMemberController
 * - 기존 회원 역할 변경 API 유지
 * - 관리자 회원 목록/상세/등록/수정/이메일중복체크 추가
 */
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final AdminMemberService adminMemberService;
    private final AuditLogService auditLogService;

    /**
     * 기존 역할 변경용 목록
     */
    @GetMapping
    public List<AdminMemberDtos.MemberResponse> listMembers() {
        return adminMemberService.listMembers();
    }

    /**
     * 기존 역할 변경 API
     */
    @PutMapping("/{memberId}/roles")
    public ResponseEntity<AdminMemberDtos.MemberResponse> updateRoles(
            @PathVariable Long memberId,
            @Valid @RequestBody AdminMemberDtos.UpdateMemberRolesRequest req,
            HttpServletRequest request
    ) {
        AdminMemberDtos.MemberResponse response = adminMemberService.updateMemberRoles(memberId, req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.MEMBER_ROLE_UPDATE,
                "회원 역할 수정: memberId=" + memberId + ", roles=" + req.roleIds().size(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * 관리자 회원 목록 조회
     */
    @GetMapping("/manage")
    public ResponseEntity<PageResponse<AdminMemberDtos.MemberListResponse>> listMembersForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String searchType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(
                adminMemberService.listMembersForAdmin(page, size, searchType, keyword, role, status)
        );
    }

    /**
     * 관리자 회원 상세 조회
     */
    @GetMapping("/manage/{memberId}")
    public ResponseEntity<AdminMemberDtos.MemberDetailResponse> getMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(adminMemberService.getMember(memberId));
    }

    /**
     * 이메일 중복체크
     */
    @GetMapping("/check-email")
    public ResponseEntity<AdminMemberDtos.EmailDuplicateCheckResponse> checkEmailDuplicate(
            @RequestParam String email
    ) {
        return ResponseEntity.ok(adminMemberService.checkEmailDuplicate(email));
    }

    /**
     * 관리자 회원 등록
     */
    @PostMapping("/manage")
    public ResponseEntity<AdminMemberDtos.MemberDetailResponse> createMember(
            @Valid @RequestBody AdminMemberDtos.CreateMemberRequest req,
            HttpServletRequest request
    ) {
        AdminMemberDtos.MemberDetailResponse response = adminMemberService.createMember(req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.MEMBER_CREATE,
                "회원 생성: memberId=" + response.id() + ", email=" + response.email(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * 관리자 회원 수정
     */
    @PutMapping("/manage/{memberId}")
    public ResponseEntity<AdminMemberDtos.MemberDetailResponse> updateMember(
            @PathVariable Long memberId,
            @Valid @RequestBody AdminMemberDtos.UpdateMemberRequest req,
            HttpServletRequest request
    ) {
        AdminMemberDtos.MemberDetailResponse response = adminMemberService.updateMember(memberId, req);
        auditLogService.logCurrentActorAction(AuditCategory.ADMIN, AuditEventType.MEMBER_UPDATE,
                "회원 수정: memberId=" + memberId + ", email=" + response.email(), request);
        return ResponseEntity.ok(response);
    }
}
