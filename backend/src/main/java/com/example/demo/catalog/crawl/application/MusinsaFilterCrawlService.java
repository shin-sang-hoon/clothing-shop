package com.example.demo.catalog.crawl.application;

import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryRepository;
import com.example.demo.catalog.category.domain.CategoryTagGroupMap;
import com.example.demo.catalog.category.domain.CategoryTagGroupMapRepository;
import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterGroup;
import com.example.demo.catalog.filter.domain.FilterGroupRepository;
import com.example.demo.catalog.filter.domain.FilterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MusinsaFilterCrawlService {

    private final MusinsaCrawlerExecutor musinsaCrawlerExecutor;
    private final CategoryRepository categoryRepository;
    private final CategoryTagGroupMapRepository categoryTagGroupMapRepository;
    private final FilterGroupRepository filterGroupRepository;
    private final FilterRepository filterRepository;
    private final FilterImageStorageService filterImageStorageService;

    @Transactional(readOnly = true)
    public CatalogCrawlDtos.CrawlResponse previewFilters(String categoryCode) {
        Category category = resolveSingleCrawlCategory(categoryCode);
        if (category == null) {
            return new CatalogCrawlDtos.CrawlResponse(
                    "musinsa",
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    List.of(),
                    List.of(),
                    List.of(),
                    Map.of(),
                    Map.of()
            );
        }

        return musinsaCrawlerExecutor.execute("tag", category.getCode());
    }

    @Transactional
    public CatalogCrawlDtos.TagImportResult importFilters(String categoryCode) {
        Category category = resolveSingleCrawlCategory(categoryCode);
        if (category == null) {
            return new CatalogCrawlDtos.TagImportResult("musinsa", 0, 0, 0, 0, 0, 0, 0, 0);
        }

        CatalogCrawlDtos.CrawlResponse response;
        try {
            response = musinsaCrawlerExecutor.execute("tag", category.getCode());
        } catch (IllegalStateException exception) {
            log.warn("필터 크롤링 실패 categoryCode={}, categoryName={}", category.getCode(), category.getName(), exception);
            return new CatalogCrawlDtos.TagImportResult("musinsa", 1, 1, 0, 0, 0, 0, 0, 0);
        }

        Map<String, CatalogCrawlDtos.CrawlTagGroupItem> filters = response.tags();
        if (filters == null || filters.isEmpty()) {
            return new CatalogCrawlDtos.TagImportResult("musinsa", 1, 0, 0, 0, 0, 0, 0, 0);
        }

        int totalGroupCount = 0;
        int importedGroupCount = 0;
        int skippedGroupCount = 0;
        int totalFilterCount = 0;
        int importedFilterCount = 0;
        int skippedFilterCount = 0;
        int groupSortOrderSeed = filterGroupRepository.findAll().size();
        int mapSortOrder = categoryTagGroupMapRepository.findByCategoryIdWithTagGroup(category.getId()).size();

        for (Map.Entry<String, CatalogCrawlDtos.CrawlTagGroupItem> entry : filters.entrySet()) {
            totalGroupCount++;
            groupSortOrderSeed++;

            String groupKey = entry.getKey();
            CatalogCrawlDtos.CrawlTagGroupItem groupItem = entry.getValue();
            String groupCode = normalizeGroupCode(groupKey);
            String groupName = normalizeText(groupItem.title());

            if (groupCode.isBlank() || groupName.isBlank()) {
                skippedGroupCount++;
                totalFilterCount += groupItem.list() == null ? 0 : groupItem.list().size();
                skippedFilterCount += groupItem.list() == null ? 0 : groupItem.list().size();
                continue;
            }

            FilterGroup filterGroup = filterGroupRepository.findByCode(groupCode).orElse(null);
            if (filterGroup == null) {
                filterGroup = new FilterGroup();
                filterGroup.setCode(groupCode);
                filterGroup.setName(limit(groupName, 100));
                filterGroup.setMultiSelectYn(Boolean.TRUE.equals(groupItem.isMultiple()));
                filterGroup.setSortOrder(groupSortOrderSeed);
                filterGroup.setUseYn(true);
                filterGroup.setDescription(limit(buildFilterGroupDescription(category, groupItem), 500));
                filterGroup = filterGroupRepository.save(filterGroup);
                importedGroupCount++;
            } else {
                skippedGroupCount++;
            }

            if (!categoryTagGroupMapRepository.existsByCategoryIdAndTagGroupId(category.getId(), filterGroup.getId())) {
                CategoryTagGroupMap map = new CategoryTagGroupMap();
                map.setCategory(category);
                map.setTagGroup(filterGroup);
                map.setSortOrder(++mapSortOrder);
                categoryTagGroupMapRepository.save(map);
            }

            if (groupItem.list() == null || groupItem.list().isEmpty()) {
                continue;
            }

            int filterSortOrder = 0;
            for (CatalogCrawlDtos.CrawlTagItem filterItem : groupItem.list()) {
                filterSortOrder++;
                totalFilterCount++;

                String filterName = normalizeText(filterItem.displayText());
                String filterCode = normalizeFilterCode(groupCode, filterItem.parameterKey(), filterItem.value());

                if (filterName.isBlank() || filterCode.isBlank() || filterRepository.existsByCode(filterCode)) {
                    skippedFilterCount++;
                    continue;
                }

                Filter filter = new Filter();
                filter.setFilterGroup(filterGroup);
                filter.setName(limit(filterName, 100));
                filter.setCode(filterCode);
                filter.setSortOrder(filterSortOrder);
                filter.setUseYn(true);
                filter.setColorHex(resolveColorHex(groupCode, filterItem.value()));
                String storedImageUrl = filterImageStorageService.saveFilterImage(filterCode, normalizeText(filterItem.imageUrl()));
                filter.setIconImageUrl(limit(normalizeNullableText(storedImageUrl), 500));
                filter.setDescription(limit(buildFilterDescription(category, filterItem), 500));
                filterRepository.save(filter);
                importedFilterCount++;
            }
        }

        return new CatalogCrawlDtos.TagImportResult(
                "musinsa",
                1,
                0,
                totalGroupCount,
                importedGroupCount,
                skippedGroupCount,
                totalFilterCount,
                importedFilterCount,
                skippedFilterCount
        );
    }

    private Category resolveSingleCrawlCategory(String categoryCode) {
        String normalizedCode = normalizeNullableText(categoryCode);
        if (normalizedCode == null) {
            return null;
        }

        Category category = categoryRepository.findByCode(normalizedCode).orElse(null);
        if (category == null || !category.isUseYn()) {
            return null;
        }

        Category root = resolveRootCategory(category);
        if (root == null || !root.isUseYn()) {
            return null;
        }

        return category;
    }

    private Category resolveRootCategory(Category category) {
        Category cursor = category;
        while (cursor != null && cursor.getParent() != null) {
            cursor = cursor.getParent();
        }
        return cursor;
    }

    private String normalizeGroupCode(String value) {
        return normalizeCode(value);
    }

    private String normalizeFilterCode(String groupCode, String parameterKey, String value) {
        String normalizedGroupCode = normalizeCode(groupCode);
        String normalizedParameterKey = normalizeCode(parameterKey);
        String normalizedValue = normalizeCode(value);

        if (normalizedGroupCode.isBlank() || normalizedValue.isBlank()) {
            return "";
        }

        if (normalizedParameterKey.isBlank()) {
            return normalizedGroupCode + "_" + normalizedValue;
        }

        return normalizedGroupCode + "_" + normalizedParameterKey + "_" + normalizedValue;
    }

    private String normalizeCode(String value) {
        if (value == null) {
            return "";
        }

        return value.trim()
                .replaceAll("[^A-Za-z0-9]+", "_")
                .replaceAll("^_+|_+$", "")
                .toUpperCase();
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

    private String buildFilterGroupDescription(Category category, CatalogCrawlDtos.CrawlTagGroupItem groupItem) {
        StringBuilder builder = new StringBuilder();
        builder.append("sourceCategoryCode=").append(category.getCode());

        if (normalizeNullableText(category.getName()) != null) {
            builder.append(", sourceCategoryName=").append(category.getName().trim());
        }
        if (normalizeNullableText(groupItem.apiUrl()) != null) {
            builder.append(", apiUrl=").append(groupItem.apiUrl().trim());
        }

        return builder.toString();
    }

    private String buildFilterDescription(Category category, CatalogCrawlDtos.CrawlTagItem filterItem) {
        StringBuilder builder = new StringBuilder();
        builder.append("sourceCategoryCode=").append(category.getCode());

        if (normalizeNullableText(filterItem.parameterKey()) != null) {
            builder.append(", parameterKey=").append(filterItem.parameterKey().trim());
        }
        if (normalizeNullableText(filterItem.value()) != null) {
            builder.append(", value=").append(filterItem.value().trim());
        }
        if (normalizeNullableText(filterItem.englishDisplayText()) != null) {
            builder.append(", englishDisplayText=").append(filterItem.englishDisplayText().trim());
        }
        if (Boolean.TRUE.equals(filterItem.isNew())) {
            builder.append(", isNew=true");
        }
        if (normalizeNullableText(filterItem.selectedImageUrl()) != null) {
            builder.append(", selectedImageUrl=").append(filterItem.selectedImageUrl().trim());
        }

        return builder.toString();
    }

    private String resolveColorHex(String groupCode, String value) {
        if (!"COLOR".equals(normalizeCode(groupCode))) {
            return null;
        }

        return switch (normalizeCode(value)) {
            case "BLACK" -> "#000000";
            case "WHITE" -> "#FFFFFF";
            case "IVORY" -> "#F4F0E6";
            case "BEIGE" -> "#D6C2A1";
            case "BROWN" -> "#8B5A2B";
            case "DARKBROWN" -> "#5C4033";
            case "GRAY" -> "#808080";
            case "LIGHTGRAY" -> "#D3D3D3";
            case "DARKGRAY" -> "#4A4A4A";
            case "RED" -> "#C62828";
            case "PINK" -> "#F48FB1";
            case "ORANGE" -> "#F57C00";
            case "YELLOW" -> "#FBC02D";
            case "GREEN" -> "#2E7D32";
            case "MINT" -> "#98FF98";
            case "SKYBLUE" -> "#87CEEB";
            case "BLUE" -> "#1565C0";
            case "NAVY" -> "#1A237E";
            case "PURPLE" -> "#7B1FA2";
            case "LAVENDER" -> "#B39DDB";
            case "KHAKI" -> "#8A9A5B";
            default -> null;
        };
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
