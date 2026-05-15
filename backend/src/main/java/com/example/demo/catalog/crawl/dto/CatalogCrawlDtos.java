package com.example.demo.catalog.crawl.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * CatalogCrawlDtos
 * - Python 크롤러 응답 DTO 모음
 */
public final class CatalogCrawlDtos {

    private CatalogCrawlDtos() {
    }

    /**
     * CrawlResponse
     * - Python 전체 응답
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CrawlResponse(
            String source,
            int categoryCount,
            int brandCount,
            int itemCount,
            int tagGroupCount,
            int tagCount,
            int catalogTotalCount,
            List<CrawlCategoryItem> categories,
            List<CrawlBrandItem> brands,
            List<CrawlItemItem> items,
            Map<String, CrawlTagGroupItem> tags,
            Map<String, Object> timings
    ) {
    }

    /**
     * CrawlCategoryItem
     * - 카테고리 정규화 결과
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CrawlCategoryItem(
            Integer depth,
            String name,
            String code,
            String parentCode,
            String parentName,
            Integer sortOrder,
            String imageUrl,
            String description
    ) {
    }

    /**
     * CrawlBrandItem
     * - 브랜드 import 정규화 결과
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CrawlBrandItem(
            String rawId,
            String code,
            String nameKr,
            String nameEn,
            Integer displayOrder,
            Boolean exclusiveYn,
            String logoImageUrl,
            String categoryText
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CrawlItemItem(
            String goodsNo,
            String goodsName,
            String goodsLinkUrl,
            String brandName,
            String brandCode,
            String categoryDepth1Name,
            String categoryDepth2Name,
            String categoryDepth2Code,
            String displayGenderText,
            Integer normalPrice,
            Integer salePrice,
            String thumbnailImageUrl,
            List<String> goodsImageUrls,
            String goodsContents,
            List<String> tags,
            List<CrawlItemOptionValue> optionValues,
            Boolean soldOut
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CrawlItemOptionValue(
            String groupName,
            String value
    ) {
    }

    /**
     * CrawlTagGroupItem
     * - 필터 JSON의 그룹 1개
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CrawlTagGroupItem(
            String title,
            Boolean isMultiple,
            String apiUrl,
            List<CrawlTagItem> list
    ) {
    }

    /**
     * CrawlTagItem
     * - 그룹 내부 필터 1개
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CrawlTagItem(
            String displayText,
            String value,
            String parameterKey,
            String englishDisplayText,
            String imageUrl,
            String selectedImageUrl,
            Boolean isNew
    ) {
    }

    /**
     * CategoryImportResult
     * - 카테고리 import 결과 응답
     */
    public record CategoryImportResult(
            String source,
            int totalCount,
            int importedCount,
            int updatedCount,
            int skippedCount
    ) {
    }

    /**
     * BrandImportResult
     * - 브랜드 import 결과 응답
     */
    public record BrandImportResult(
            String source,
            int totalCount,
            int importedCount,
            int skippedCount
    ) {
    }

    /**
     * TagImportResult
     * - 태그그룹/태그 import 결과 응답
     */
    public record TagImportResult(
            String source,
            int crawledCategoryCount,
            int failedCategoryCount,
            int totalGroupCount,
            int importedGroupCount,
            int skippedGroupCount,
            int totalTagCount,
            int importedTagCount,
            int skippedTagCount
    ) {
    }

    public record ItemImportResult(
            String source,
            String categoryCode,
            int listedCount,
            int importedCount,
            int skippedCount,
            int failedCount
    ) {
    }

    public record CrawlJobStartResponse(
            String jobId,
            String jobType,
            String status,
            String message
    ) {
    }

    public record CrawlJobStatusResponse(
            String jobId,
            String jobType,
            String status,
            String message,
            Instant startedAt,
            Instant finishedAt,
            Object result
    ) {
    }

    public record CrawlTestResponse(
            String categoryCode,
            long apiElapsedMs,
            Map<String, Object> timings,
            int itemCount,
            List<CrawlItemItem> items
    ) {
    }
}
