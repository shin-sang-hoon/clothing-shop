package com.example.demo.catalog.crawl.application;

import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryRepository;
import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * MusinsaCategoryCrawlService
 * - 카테고리 preview/import만 담당
 */
@Service
@RequiredArgsConstructor
public class MusinsaCategoryCrawlService {

    private final CategoryRepository categoryRepository;
    private final CategoryImageStorageService categoryImageStorageService;
    private final MusinsaCrawlerExecutor musinsaCrawlerExecutor;

    public CatalogCrawlDtos.CrawlResponse previewCategories() {
        return musinsaCrawlerExecutor.execute("category");
    }

    @Transactional
    public CatalogCrawlDtos.CategoryImportResult importCategories() {
        CatalogCrawlDtos.CrawlResponse response = previewCategories();

        int totalCount = response.categories() == null ? 0 : response.categories().size();
        int importedCount = 0;
        int skippedCount = 0;

        if (response.categories() == null || response.categories().isEmpty()) {
            return new CatalogCrawlDtos.CategoryImportResult(response.source(), 0, 0, 0, 0);
        }

        Map<String, Category> savedCategoryMap = new HashMap<>();

        List<CatalogCrawlDtos.CrawlCategoryItem> sortedItems = response.categories().stream()
                .sorted(Comparator
                        .comparing((CatalogCrawlDtos.CrawlCategoryItem item) -> item.depth() != null ? item.depth() : 999)
                        .thenComparing(item -> item.sortOrder() != null ? item.sortOrder() : 0)
                        .thenComparing(item -> item.code() != null ? item.code() : "")
                )
                .toList();

        for (CatalogCrawlDtos.CrawlCategoryItem item : sortedItems) {
            String normalizedCode = normalizeCode(item.code());
            String normalizedName = normalizeText(item.name());

            if (normalizedCode.isBlank() || normalizedName.isBlank()) {
                skippedCount++;
                continue;
            }

            Category parent = resolveParentByCode(item.parentCode(), savedCategoryMap);

            if (hasText(item.parentCode()) && parent == null) {
                skippedCount++;
                continue;
            }

            if (categoryRepository.existsByCode(normalizedCode)) {
                skippedCount++;
                continue;
            }

            Category category = new Category();

            category.setCode(normalizedCode);
            category.setName(limit(normalizedName, 100));
            category.setParent(parent);
            category.setDepth(parent == null ? 1 : parent.getDepth() + 1);
            category.setSortOrder(item.sortOrder() != null ? item.sortOrder() : 0);
            category.setUseYn(true);

            String storedCategoryImageUrl = categoryImageStorageService.saveCategoryImage(
                    normalizedCode,
                    normalizeText(item.imageUrl())
            );
            category.setImageUrl(limit(normalizeNullableText(storedCategoryImageUrl), 500));
            category.setDescription(limit(normalizeNullableText(item.description()), 500));

            Category saved = categoryRepository.save(category);
            savedCategoryMap.put(saved.getCode(), saved);
            importedCount++;
        }

        return new CatalogCrawlDtos.CategoryImportResult(
                response.source(),
                totalCount,
                importedCount,
                0,
                skippedCount
        );
    }

    private Category resolveParentByCode(String parentCode, Map<String, Category> savedCategoryMap) {
        String normalizedParentCode = normalizeCode(parentCode);

        if (normalizedParentCode.isBlank()) {
            return null;
        }

        Category cached = savedCategoryMap.get(normalizedParentCode);
        if (cached != null) {
            return cached;
        }

        return categoryRepository.findByCode(normalizedParentCode).orElse(null);
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

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isBlank();
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
