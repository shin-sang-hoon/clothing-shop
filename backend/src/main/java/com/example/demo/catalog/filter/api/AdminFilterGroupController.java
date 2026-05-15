package com.example.demo.catalog.filter.api;

import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.catalog.filter.application.FilterGroupService;
import com.example.demo.catalog.filter.dto.AdminFilterGroupDtos;
import com.example.demo.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/filter-groups", "/api/admin/tag-groups"})
@RequiredArgsConstructor
public class AdminFilterGroupController {

    private final FilterGroupService filterGroupService;
    private final AuditLogService auditLogService;

    @GetMapping
    public PageResponse<AdminFilterGroupDtos.FilterGroupListResponse> getFilterGroups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean multiSelectYn,
            @RequestParam(required = false) Boolean useYn
    ) {
        return filterGroupService.getFilterGroups(page, size, keyword, multiSelectYn, useYn);
    }

    @GetMapping({"/with-filters", "/with-tags"})
    public List<AdminFilterGroupDtos.FilterGroupWithFiltersResponse> getFilterGroupsWithFilters() {
        return filterGroupService.getFilterGroupsWithFilters();
    }

    @GetMapping("/{filterGroupId}")
    public AdminFilterGroupDtos.FilterGroupDetailResponse getFilterGroup(@PathVariable Long filterGroupId) {
        return filterGroupService.getFilterGroup(filterGroupId);
    }

    @PostMapping
    public AdminFilterGroupDtos.FilterGroupDetailResponse createFilterGroup(
            @Valid @RequestBody AdminFilterGroupDtos.CreateFilterGroupRequest req,
            HttpServletRequest request
    ) {
        AdminFilterGroupDtos.FilterGroupDetailResponse response = filterGroupService.createFilterGroup(req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.FILTER_GROUP_CREATE,
                "필터 그룹 생성: filterGroupId=" + response.id() + ", code=" + response.code(),
                request
        );
        return response;
    }

    @PutMapping("/{filterGroupId}")
    public AdminFilterGroupDtos.FilterGroupDetailResponse updateFilterGroup(
            @PathVariable Long filterGroupId,
            @Valid @RequestBody AdminFilterGroupDtos.UpdateFilterGroupRequest req,
            HttpServletRequest request
    ) {
        AdminFilterGroupDtos.FilterGroupDetailResponse response = filterGroupService.updateFilterGroup(filterGroupId, req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.FILTER_GROUP_UPDATE,
                "필터 그룹 수정: filterGroupId=" + filterGroupId + ", code=" + response.code(),
                request
        );
        return response;
    }

    @PatchMapping("/{filterGroupId}/use")
    public AdminFilterGroupDtos.FilterGroupDetailResponse updateUseYn(
            @PathVariable Long filterGroupId,
            @Valid @RequestBody AdminFilterGroupDtos.UpdateFilterGroupUseRequest req,
            HttpServletRequest request
    ) {
        AdminFilterGroupDtos.FilterGroupDetailResponse response = filterGroupService.updateUseYn(filterGroupId, req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.FILTER_GROUP_USE_UPDATE,
                "필터 그룹 사용여부 변경: filterGroupId=" + filterGroupId + ", useYn=" + req.useYn(),
                request
        );
        return response;
    }

    @DeleteMapping("/{filterGroupId}")
    public ResponseEntity<Void> deleteFilterGroup(
            @PathVariable Long filterGroupId,
            HttpServletRequest request
    ) {
        filterGroupService.deleteFilterGroup(filterGroupId);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.FILTER_GROUP_DELETE,
                "필터 그룹 삭제: filterGroupId=" + filterGroupId,
                request
        );
        return ResponseEntity.noContent().build();
    }
}
