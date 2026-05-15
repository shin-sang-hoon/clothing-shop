package com.example.demo.catalog.mapping.api;

import com.example.demo.catalog.mapping.application.AdminMappingService;
import com.example.demo.catalog.mapping.application.MappingAutoSyncJobService;
import com.example.demo.catalog.mapping.dto.AdminMappingDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/mappings")
@RequiredArgsConstructor
public class AdminMappingController {

    private final AdminMappingService adminMappingService;
    private final MappingAutoSyncJobService mappingAutoSyncJobService;

    @GetMapping("/categories/{categoryId}")
    public AdminMappingDtos.MappingDetailResponse getCategoryMapping(@PathVariable Long categoryId) {
        return adminMappingService.getCategoryMapping(categoryId);
    }

    @PutMapping("/categories/{categoryId}")
    public AdminMappingDtos.MappingDetailResponse updateCategoryMapping(
            @PathVariable Long categoryId,
            @Valid @RequestBody AdminMappingDtos.UpdateMappingRequest req
    ) {
        return adminMappingService.updateCategoryMapping(categoryId, req);
    }

    @PostMapping("/categories/{categoryId}/auto-sync")
    public AdminMappingDtos.MappingDetailResponse autoMapCategory(@PathVariable Long categoryId) {
        return adminMappingService.autoMapCategory(categoryId);
    }

    @PostMapping("/categories/auto-sync-all")
    public AdminMappingDtos.MappingJobStartResponse autoMapAllCategories() {
        return mappingAutoSyncJobService.startJob(
                "CATEGORY_AUTO_SYNC_ALL",
                adminMappingService::autoMapAllCategories
        );
    }

    @GetMapping("/brands/{brandId}")
    public AdminMappingDtos.MappingDetailResponse getBrandMapping(@PathVariable Long brandId) {
        return adminMappingService.getBrandMapping(brandId);
    }

    @PutMapping("/brands/{brandId}")
    public AdminMappingDtos.MappingDetailResponse updateBrandMapping(
            @PathVariable Long brandId,
            @Valid @RequestBody AdminMappingDtos.UpdateMappingRequest req
    ) {
        return adminMappingService.updateBrandMapping(brandId, req);
    }

    @PostMapping("/brands/{brandId}/auto-sync")
    public AdminMappingDtos.MappingDetailResponse autoMapBrand(@PathVariable Long brandId) {
        return adminMappingService.autoMapBrand(brandId);
    }

    @PostMapping("/brands/auto-sync-all")
    public AdminMappingDtos.MappingJobStartResponse autoMapAllBrands() {
        return mappingAutoSyncJobService.startJob(
                "BRAND_AUTO_SYNC_ALL",
                adminMappingService::autoMapAllBrands
        );
    }

    @GetMapping("/jobs/{jobId}")
    public AdminMappingDtos.MappingJobStatusResponse getAutoSyncJobStatus(@PathVariable String jobId) {
        return mappingAutoSyncJobService.getJobStatus(jobId);
    }
}
