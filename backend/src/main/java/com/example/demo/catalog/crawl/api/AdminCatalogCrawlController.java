package com.example.demo.catalog.crawl.api;

import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.catalog.crawl.application.CatalogCrawlJobService;
import com.example.demo.catalog.crawl.application.MusinsaCatalogCrawlService;
import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/catalog/crawl")
public class AdminCatalogCrawlController {

    private final MusinsaCatalogCrawlService musinsaCatalogCrawlService;
    private final CatalogCrawlJobService catalogCrawlJobService;
    private final AuditLogService auditLogService;

    @PostMapping("/preview")
    public ResponseEntity<CatalogCrawlDtos.CrawlResponse> previewAll() {
        return ResponseEntity.ok(musinsaCatalogCrawlService.previewAll());
    }

    @PostMapping("/categories/preview")
    public ResponseEntity<CatalogCrawlDtos.CrawlResponse> previewCategories() {
        return ResponseEntity.ok(musinsaCatalogCrawlService.previewCategories());
    }

    @PostMapping("/categories/import")
    public ResponseEntity<CatalogCrawlDtos.CategoryImportResult> importCategories(HttpServletRequest request) {
        CatalogCrawlDtos.CategoryImportResult response = musinsaCatalogCrawlService.importCategories();
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.CATALOG_CATEGORY_IMPORT,
                "카테고리 크롤링 반영: imported=" + response.importedCount() + ", skipped=" + response.skippedCount(),
                request
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/brands/preview")
    public ResponseEntity<CatalogCrawlDtos.CrawlResponse> previewBrands() {
        return ResponseEntity.ok(musinsaCatalogCrawlService.previewBrands());
    }

    @PostMapping("/brands/import")
    public ResponseEntity<CatalogCrawlDtos.CrawlJobStartResponse> importBrands(HttpServletRequest request) {
        CatalogCrawlDtos.CrawlJobStartResponse response = catalogCrawlJobService.startJob(
                "BRAND_IMPORT",
                musinsaCatalogCrawlService::importBrands
        );
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.CATALOG_BRAND_IMPORT,
                "브랜드 크롤링 비동기 시작: jobId=" + response.jobId(),
                request
        );
        return ResponseEntity.accepted().body(response);
    }

    @PostMapping({"/filters/preview", "/tags/preview"})
    public ResponseEntity<CatalogCrawlDtos.CrawlResponse> previewFilters(@RequestParam String categoryCode) {
        return ResponseEntity.ok(musinsaCatalogCrawlService.previewFilters(categoryCode));
    }

    @PostMapping({"/filters/import", "/tags/import"})
    public ResponseEntity<CatalogCrawlDtos.TagImportResult> importFilters(
            @RequestParam String categoryCode,
            HttpServletRequest request
    ) {
        CatalogCrawlDtos.TagImportResult response = musinsaCatalogCrawlService.importFilters(categoryCode);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.CATALOG_FILTER_IMPORT,
                "필터 크롤링 반영: categoryCode=" + categoryCode + ", importedFilters=" + response.importedTagCount(),
                request
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/items/import")
    public ResponseEntity<CatalogCrawlDtos.CrawlJobStartResponse> importItems(
            @RequestParam String categoryCode,
            HttpServletRequest request
    ) {
        CatalogCrawlDtos.CrawlJobStartResponse response = catalogCrawlJobService.startJob(
                "ITEM_IMPORT",
                () -> musinsaCatalogCrawlService.importItems(categoryCode)
        );
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.CATALOG_ITEM_IMPORT,
                "아이템 크롤링 비동기 시작: categoryCode=" + categoryCode + ", jobId=" + response.jobId(),
                request
        );
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<CatalogCrawlDtos.CrawlJobStatusResponse> getJobStatus(@PathVariable String jobId) {
        return ResponseEntity.ok(catalogCrawlJobService.getJobStatus(jobId));
    }

    @PostMapping("/jobs/test")
    public ResponseEntity<CatalogCrawlDtos.CrawlTestResponse> testItemCrawl(@RequestParam String categoryCode) {
        return ResponseEntity.ok(musinsaCatalogCrawlService.testItemCrawl(categoryCode));
    }
}
