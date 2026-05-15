package com.example.demo.catalog.category.api;

import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.catalog.category.application.CategoryService;
import com.example.demo.catalog.category.dto.AdminCategoryDtos;
import com.example.demo.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;
    private final AuditLogService auditLogService;

    @GetMapping
    public PageResponse<AdminCategoryDtos.CategoryListResponse> getCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn
    ) {
        return categoryService.getCategories(page, size, keyword, useYn);
    }

    @GetMapping("/{categoryId}")
    public AdminCategoryDtos.CategoryDetailResponse getCategory(@PathVariable Long categoryId) {
        return categoryService.getCategory(categoryId);
    }

    @PostMapping
    public AdminCategoryDtos.CategoryDetailResponse createCategory(
            @Valid @RequestBody AdminCategoryDtos.CreateCategoryRequest req,
            HttpServletRequest request
    ) {
        AdminCategoryDtos.CategoryDetailResponse response = categoryService.createCategory(req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.CATEGORY_CREATE,
                "카테고리 생성: categoryId=" + response.id() + ", code=" + response.code(),
                request
        );
        return response;
    }

    @PutMapping("/{categoryId}")
    public AdminCategoryDtos.CategoryDetailResponse updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody AdminCategoryDtos.UpdateCategoryRequest req,
            HttpServletRequest request
    ) {
        AdminCategoryDtos.CategoryDetailResponse response = categoryService.updateCategory(categoryId, req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.CATEGORY_UPDATE,
                "카테고리 수정: categoryId=" + categoryId + ", code=" + response.code(),
                request
        );
        return response;
    }

    @PatchMapping("/{categoryId}/use")
    public AdminCategoryDtos.CategoryDetailResponse updateUseYn(
            @PathVariable Long categoryId,
            @Valid @RequestBody AdminCategoryDtos.UpdateCategoryUseRequest req,
            HttpServletRequest request
    ) {
        AdminCategoryDtos.CategoryDetailResponse response = categoryService.updateUseYn(categoryId, req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.CATEGORY_USE_UPDATE,
                "카테고리 사용여부 변경: categoryId=" + categoryId + ", useYn=" + req.useYn(),
                request
        );
        return response;
    }

    @GetMapping({"/{categoryId}/filter-groups", "/{categoryId}/tag-groups"})
    public List<AdminCategoryDtos.CategoryFilterGroupResponse> getCategoryFilterGroups(@PathVariable Long categoryId) {
        return categoryService.getCategoryFilterGroups(categoryId);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long categoryId,
            HttpServletRequest request
    ) {
        categoryService.deleteCategory(categoryId);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.CATEGORY_DELETE,
                "카테고리 삭제: categoryId=" + categoryId,
                request
        );
        return ResponseEntity.noContent().build();
    }
}
