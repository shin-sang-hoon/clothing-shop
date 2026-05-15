package com.example.demo.catalog.crawl.application;

import com.example.demo.catalog.brand.domain.Brand;
import com.example.demo.catalog.brand.domain.BrandRepository;
import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * MusinsaBrandCrawlService
 * - 브랜드 preview/import만 담당
 */
@Service
@RequiredArgsConstructor
public class MusinsaBrandCrawlService {

    private final BrandRepository brandRepository;
    private final BrandImageStorageService brandImageStorageService;
    private final MusinsaCrawlerExecutor musinsaCrawlerExecutor;

    public CatalogCrawlDtos.CrawlResponse previewBrands() {
        return musinsaCrawlerExecutor.execute("brand");
    }

    @Transactional
    public CatalogCrawlDtos.BrandImportResult importBrands() {
        CatalogCrawlDtos.CrawlResponse response = previewBrands();

        int totalCount = response.brands() == null ? 0 : response.brands().size();
        int importedCount = 0;
        int skippedCount = 0;

        if (response.brands() == null || response.brands().isEmpty()) {
            return new CatalogCrawlDtos.BrandImportResult(response.source(), 0, 0, 0);
        }

        for (CatalogCrawlDtos.CrawlBrandItem item : response.brands()) {
            String normalizedCode = normalizeCode(item.code());

            if (normalizedCode.isBlank()) {
                skippedCount++;
                continue;
            }

            if (brandRepository.existsByCode(normalizedCode)) {
                skippedCount++;
                continue;
            }

            Brand brand = new Brand();
            brand.setCode(normalizedCode);
            brand.setNameKo(limit(normalizeText(item.nameKr()), 100));
            brand.setNameEn(limit(normalizeEnglishName(item.nameEn(), item.rawId()), 100));
            brand.setExclusiveYn(Boolean.TRUE.equals(item.exclusiveYn()));
            brand.setSortOrder(item.displayOrder() != null ? item.displayOrder() : 0);
            brand.setUseYn(true);
            brand.setDescription(null);

            String storedImageUrl = brandImageStorageService.saveBrandLogo(
                    normalizeText(item.rawId()),
                    normalizeText(item.logoImageUrl())
            );
            brand.setIconImageUrl(storedImageUrl);

            brandRepository.save(brand);
            importedCount++;
        }

        return new CatalogCrawlDtos.BrandImportResult(
                response.source(),
                totalCount,
                importedCount,
                skippedCount
        );
    }

    private String normalizeCode(String value) {
        if (value == null) {
            return "";
        }

        return value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeEnglishName(String nameEn, String rawId) {
        String normalized = normalizeText(nameEn);
        if (!normalized.isBlank()) {
            return normalized;
        }

        return normalizeText(rawId).toUpperCase();
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
