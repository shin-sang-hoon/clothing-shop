package com.example.demo.catalog.filter.api;

import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.catalog.filter.application.FilterService;
import com.example.demo.catalog.filter.dto.AdminFilterDtos;
import com.example.demo.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/filters")
@RequiredArgsConstructor
public class AdminFilterController {

    private final FilterService filterService;
    private final AuditLogService auditLogService;

    @GetMapping
    public PageResponse<AdminFilterDtos.FilterListResponse> getFilters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long filterGroupId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn
    ) {
        return filterService.getFilters(page, size, filterGroupId, keyword, useYn);
    }

    @GetMapping("/{filterId}")
    public AdminFilterDtos.FilterDetailResponse getFilter(@PathVariable Long filterId) {
        return filterService.getFilter(filterId);
    }

    @PostMapping
    public AdminFilterDtos.FilterDetailResponse createFilter(
            @Valid @RequestBody AdminFilterDtos.CreateFilterRequest req,
            HttpServletRequest request
    ) {
        AdminFilterDtos.FilterDetailResponse response = filterService.createFilter(req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.FILTER_CREATE,
                "필터 생성: filterId=" + response.id() + ", code=" + response.code(),
                request
        );
        return response;
    }

    @PutMapping("/{filterId}")
    public AdminFilterDtos.FilterDetailResponse updateFilter(
            @PathVariable Long filterId,
            @Valid @RequestBody AdminFilterDtos.UpdateFilterRequest req,
            HttpServletRequest request
    ) {
        AdminFilterDtos.FilterDetailResponse response = filterService.updateFilter(filterId, req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.FILTER_UPDATE,
                "필터 수정: filterId=" + filterId + ", code=" + response.code(),
                request
        );
        return response;
    }

    @PatchMapping("/{filterId}/use")
    public AdminFilterDtos.FilterDetailResponse updateUseYn(
            @PathVariable Long filterId,
            @Valid @RequestBody AdminFilterDtos.UpdateFilterUseRequest req,
            HttpServletRequest request
    ) {
        AdminFilterDtos.FilterDetailResponse response = filterService.updateUseYn(filterId, req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.FILTER_USE_UPDATE,
                "필터 사용여부 변경: filterId=" + filterId + ", useYn=" + req.useYn(),
                request
        );
        return response;
    }

    @DeleteMapping("/{filterId}")
    public ResponseEntity<Void> deleteFilter(
            @PathVariable Long filterId,
            HttpServletRequest request
    ) {
        filterService.deleteFilter(filterId);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.FILTER_DELETE,
                "필터 삭제: filterId=" + filterId,
                request
        );
        return ResponseEntity.noContent().build();
    }
}
