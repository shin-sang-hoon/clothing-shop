package com.example.demo.catalog.brand.api;

import com.example.demo.catalog.brand.application.BrandService;
import com.example.demo.catalog.brand.dto.AdminBrandDtos;
import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AdminBrandController
 * - 관리자 브랜드 CRUD API
 */
@RestController
@RequestMapping("/api/admin/brands")
@RequiredArgsConstructor
public class AdminBrandController {

    private final BrandService brandService;
    private final AuditLogService auditLogService;

    /**
     * 목록 조회
     */
    @GetMapping
    public PageResponse<AdminBrandDtos.BrandListResponse> getBrands(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean exclusiveYn,
            @RequestParam(required = false) Boolean useYn
    ) {
        return brandService.getBrands(page, size, keyword, exclusiveYn, useYn);
    }

    /**
     * 상세 조회
     */
    @GetMapping("/{brandId}")
    public AdminBrandDtos.BrandDetailResponse getBrand(
            @PathVariable Long brandId
    ) {
        return brandService.getBrand(brandId);
    }

    /**
     * 등록
     */
    @PostMapping
    public AdminBrandDtos.BrandDetailResponse createBrand(
            @Valid @RequestBody AdminBrandDtos.CreateBrandRequest req,
            HttpServletRequest request
    ) {
        AdminBrandDtos.BrandDetailResponse response = brandService.createBrand(req);
        auditLogService.logCurrentActorAction(AuditCategory.SHOP, AuditEventType.BRAND_CREATE,
                "브랜드 생성: brandId=" + response.id() + ", code=" + response.code(), request);
        return response;
    }

    /**
     * 수정
     */
    @PutMapping("/{brandId}")
    public AdminBrandDtos.BrandDetailResponse updateBrand(
            @PathVariable Long brandId,
            @Valid @RequestBody AdminBrandDtos.UpdateBrandRequest req,
            HttpServletRequest request
    ) {
        AdminBrandDtos.BrandDetailResponse response = brandService.updateBrand(brandId, req);
        auditLogService.logCurrentActorAction(AuditCategory.SHOP, AuditEventType.BRAND_UPDATE,
                "브랜드 수정: brandId=" + brandId + ", code=" + response.code(), request);
        return response;
    }

    /**
     * 사용 여부 변경
     */
    @PatchMapping("/{brandId}/use")
    public AdminBrandDtos.BrandDetailResponse updateUseYn(
            @PathVariable Long brandId,
            @Valid @RequestBody AdminBrandDtos.UpdateBrandUseRequest req,
            HttpServletRequest request
    ) {
        AdminBrandDtos.BrandDetailResponse response = brandService.updateUseYn(brandId, req);
        auditLogService.logCurrentActorAction(AuditCategory.SHOP, AuditEventType.BRAND_USE_UPDATE,
                "브랜드 사용여부 변경: brandId=" + brandId + ", useYn=" + req.useYn(), request);
        return response;
    }

    /**
     * 상품 없는 브랜드 일괄 삭제
     */
    @DeleteMapping("/cleanup/empty")
    public ResponseEntity<Map<String, Integer>> deleteEmptyBrands(HttpServletRequest request) {
        int deleted = brandService.deleteEmptyBrands();
        auditLogService.logCurrentActorAction(AuditCategory.SHOP, AuditEventType.BRAND_DELETE,
                "빈 브랜드 일괄 삭제: " + deleted + "건", request);
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    /**
     * 더미 좋아요 수 일괄 부여
     */
    @PostMapping("/seed-dummy-likes")
    public ResponseEntity<Map<String, Integer>> seedDummyLikes() {
        int updated = brandService.seedDummyLikes();
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    /**
     * 삭제
     */
    @DeleteMapping("/{brandId}")
    public ResponseEntity<Void> deleteBrand(
            @PathVariable Long brandId,
            HttpServletRequest request
    ) {
        brandService.deleteBrand(brandId);
        auditLogService.logCurrentActorAction(AuditCategory.SHOP, AuditEventType.BRAND_DELETE,
                "브랜드 삭제: brandId=" + brandId, request);
        return ResponseEntity.noContent().build();
    }
}
