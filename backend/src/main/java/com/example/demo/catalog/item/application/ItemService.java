package com.example.demo.catalog.item.application;

import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryFilterMap;
import com.example.demo.catalog.category.domain.CategoryFilterMapRepository;
import com.example.demo.catalog.category.domain.CategoryRepository;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterGroup;
import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemFilter;
import com.example.demo.catalog.item.domain.ItemFilterRepository;
import com.example.demo.catalog.item.domain.ItemImage;
import com.example.demo.catalog.item.domain.ItemImageRepository;
import com.example.demo.catalog.item.domain.ItemImageType;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.catalog.item.dto.ItemDtos;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.security.HtmlSanitizer;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final ItemFilterRepository itemFilterRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryFilterMapRepository categoryFilterMapRepository;
    private final ItemViewLogService itemViewLogService;
    private final HtmlSanitizer htmlSanitizer;

    @Transactional(readOnly = true)
    public PageResponse<ItemDtos.ItemListResponse> getItems(
            int page,
            int size,
            String keyword,
            String categoryCode,
            String brand,
            String brandCode,
            List<Long> filterIds,
            List<Long> tagIds,
            String itemMode
    ) {
        Pageable pageable = createPageable(page, size);
        String normalizedKeyword = normalizeQueryText(keyword);
        String normalizedCategoryCode = normalizeQueryText(categoryCode);
        String normalizedBrand = normalizeQueryText(brand);
        String normalizedBrandCode = normalizeQueryText(brandCode);
        String normalizedItemMode = (itemMode != null && !itemMode.isBlank()) ? itemMode.trim().toUpperCase() : null;
        List<Long> normalizedFilterIds = normalizeFilterIds(filterIds);
        List<Long> normalizedTagIds = normalizeFilterIds(tagIds);
        boolean hasTagFilter = !normalizedTagIds.isEmpty();
        List<Long> tagIdsForQuery = hasTagFilter ? normalizedTagIds : List.of(-1L);

        boolean hasCategoryCode = normalizedCategoryCode != null;
        boolean hasFilterIds = !normalizedFilterIds.isEmpty();

        if (hasCategoryCode && hasFilterIds
                && isSelectingAllCategoryFilters(normalizedCategoryCode, normalizedFilterIds)) {
            hasFilterIds = false;
        }

        Page<Item> itemPage;
        if (hasCategoryCode && hasFilterIds) {
            itemPage = itemRepository.findActiveByCategoryCodeAndFilterIdsPaged(
                    normalizedCategoryCode,
                    normalizedFilterIds,
                    normalizedKeyword,
                    normalizedBrand,
                    normalizedBrandCode,
                    hasTagFilter,
                    tagIdsForQuery,
                    normalizedItemMode,
                    pageable
            );
        } else if (hasCategoryCode) {
            itemPage = itemRepository.findActiveByCategoryCodePaged(
                    normalizedCategoryCode,
                    normalizedKeyword,
                    normalizedBrand,
                    normalizedBrandCode,
                    hasTagFilter,
                    tagIdsForQuery,
                    normalizedItemMode,
                    pageable
            );
        } else if (hasFilterIds) {
            itemPage = itemRepository.findActiveByFilterIdsPaged(
                    normalizedFilterIds,
                    normalizedKeyword,
                    normalizedBrand,
                    normalizedBrandCode,
                    hasTagFilter,
                    tagIdsForQuery,
                    normalizedItemMode,
                    pageable
            );
        } else {
            itemPage = itemRepository.findActivePaged(
                    normalizedKeyword,
                    normalizedBrand,
                    normalizedBrandCode,
                    hasTagFilter,
                    tagIdsForQuery,
                    normalizedItemMode,
                    pageable
            );
        }

        List<Item> items = itemPage.getContent();
        List<Long> itemIds = items.stream().map(Item::getId).toList();

        Map<Long, String> mainImageMap = itemIds.isEmpty()
                ? Collections.emptyMap()
                : itemImageRepository.findByItemIdInAndImageTypeOrderByItemIdAscSortOrderAsc(
                                itemIds,
                                ItemImageType.MAIN
                        ).stream()
                        .collect(Collectors.toMap(
                                img -> img.getItem().getId(),
                                ItemImage::getImageUrl,
                                (a, b) -> a
                        ));

        List<ItemDtos.ItemListResponse> content = items.stream()
                .map(item -> toListResponse(
                        item,
                        mainImageMap.get(item.getId()),
                        Collections.emptyList()
                ))
                .toList();

        return new PageResponse<>(
                content,
                itemPage.getNumber(),
                itemPage.getSize(),
                itemPage.getTotalElements(),
                itemPage.getTotalPages(),
                itemPage.isFirst(),
                itemPage.isLast()
        );
    }

    @Transactional
    public ItemDtos.ItemDetailResponse getItem(Long itemId, String memberEmail, HttpServletRequest request) {
        Item item = itemRepository.findByIdWithBrandAndCategory(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + itemId));

        if (!item.isUseYn()) {
            throw new IllegalArgumentException("조회할 수 없는 상품입니다. id=" + itemId);
        }

        if (itemViewLogService.logViewIfNotDuplicate(item, memberEmail, request)) {
            item.setViewCnt((item.getViewCnt() != null ? item.getViewCnt() : 0) + 1);
        }

        List<ItemImage> images = itemImageRepository.findByItemIdOrderByImageTypeAscSortOrderAsc(itemId);
        List<ItemFilter> itemFilters = itemFilterRepository.findByItemIdWithTag(itemId);

        return toDetailResponse(item, images, itemFilters);
    }

    private ItemDtos.ItemListResponse toListResponse(
            Item item,
            String mainImg,
            List<String> subImgs
    ) {
        return new ItemDtos.ItemListResponse(
                item.getId(),
                item.getItemNo(),
                item.getName(),
                item.getBrand() != null ? item.getBrand().getId() : null,
                item.getBrand() != null ? item.getBrand().getCode() : null,
                item.getBrand() != null ? item.getBrand().getNameKo() : null,
                item.getCategory() != null ? item.getCategory().getId() : null,
                item.getCategory() != null ? item.getCategory().getCode() : null,
                item.getCategory() != null ? item.getCategory().getName() : null,
                item.getKind(),
                item.getRetailPrice(),
                item.getRentalPrice(),
                item.getItemMode(),
                item.getLikeCnt(),
                item.getViewCnt() != null ? item.getViewCnt() : 0,
                item.getStatus(),
                mainImg,
                subImgs
        );
    }

    private ItemDtos.ItemDetailResponse toDetailResponse(
            Item item,
            List<ItemImage> images,
            List<ItemFilter> itemFilters
    ) {
        String mainImg = images.stream()
                .filter(img -> img.getImageType() == ItemImageType.MAIN)
                .map(ItemImage::getImageUrl)
                .findFirst()
                .orElse(null);

        List<String> subImgs = images.stream()
                .filter(img -> img.getImageType() == ItemImageType.SUB)
                .map(ItemImage::getImageUrl)
                .toList();

        Map<Long, List<ItemFilter>> groupedByFilterGroup = itemFilters.stream()
                .collect(Collectors.groupingBy(it -> it.getTag().getFilterGroup().getId()));

        List<ItemDtos.TagGroupSummary> tagGroups = groupedByFilterGroup.entrySet().stream()
                .map(entry -> {
                    List<ItemFilter> groupFilters = entry.getValue();
                    FilterGroup filterGroup = groupFilters.get(0).getTag().getFilterGroup();
                    List<ItemDtos.ItemTag> tagList = groupFilters.stream()
                            .map(it -> toItemTag(it.getTag()))
                            .toList();
                    return new ItemDtos.TagGroupSummary(
                            filterGroup.getId(),
                            filterGroup.getName(),
                            filterGroup.getCode(),
                            tagList
                    );
                })
                .sorted(Comparator.comparing(summary -> {
                    List<ItemFilter> groupFilters = groupedByFilterGroup.get(summary.groupId());
                    FilterGroup filterGroup = groupFilters.get(0).getTag().getFilterGroup();
                    return filterGroup.getSortOrder() != null ? filterGroup.getSortOrder() : 0;
                }))
                .toList();

        return new ItemDtos.ItemDetailResponse(
                item.getId(),
                item.getItemNo(),
                item.getName(),
                item.getBrand() != null ? item.getBrand().getId() : null,
                item.getBrand() != null ? item.getBrand().getNameKo() : null,
                item.getBrand() != null ? item.getBrand().getIconImageUrl() : null,
                item.getCategory() != null ? item.getCategory().getName() : null,
                item.getKind(),
                item.getRetailPrice(),
                item.getRentalPrice(),
                item.getItemMode(),
                item.getLikeCnt() != null ? item.getLikeCnt() : 0,
                item.getViewCnt() != null ? item.getViewCnt() : 0,
                item.getStatus(),
                mainImg,
                subImgs,
                tagGroups,
                htmlSanitizer.sanitizeRichText(item.getDetailContent())
        );
    }

    private ItemDtos.ItemTag toItemTag(Filter filter) {
        return new ItemDtos.ItemTag(filter.getId(), filter.getName(), filter.getCode(), filter.getColorHex());
    }

    private String normalizeQueryText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private Pageable createPageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), size <= 0 ? 20 : size);
    }

    private List<Long> normalizeFilterIds(List<Long> filterIds) {
        if (filterIds == null || filterIds.isEmpty()) {
            return List.of();
        }
        return filterIds.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
    }

    private boolean isSelectingAllCategoryFilters(String categoryCode, List<Long> selectedFilterIds) {
        Optional<Category> category = categoryRepository.findByCode(categoryCode);
        if (category.isEmpty()) {
            return false;
        }

        List<Long> targetCategoryIds = resolveTargetCategoryIds(category.get());
        List<CategoryFilterMap> filterMaps = targetCategoryIds.size() == 1
                ? categoryFilterMapRepository.findByCategoryIdOrderBySortOrderAscIdAsc(targetCategoryIds.get(0))
                : categoryFilterMapRepository.findByCategoryIdInOrderBySortOrderAscIdAsc(targetCategoryIds);

        Set<Long> mappedFilterIds = new LinkedHashSet<>();
        for (CategoryFilterMap map : filterMaps) {
            if (!map.isUseYn() || map.getFilter() == null || !map.getFilter().isUseYn()) {
                continue;
            }
            FilterGroup filterGroup = map.getFilter().getFilterGroup();
            if (filterGroup == null || !filterGroup.isUseYn()) {
                continue;
            }
            mappedFilterIds.add(map.getFilter().getId());
        }

        return !mappedFilterIds.isEmpty() && selectedFilterIds.containsAll(mappedFilterIds);
    }

    private List<Long> resolveTargetCategoryIds(Category category) {
        if (category.getDepth() != null && category.getDepth() == 1) {
            List<Long> targetIds = new java.util.ArrayList<>();
            targetIds.add(category.getId());
            List<Long> childIds = categoryRepository.findByParentIdAndUseYnTrueOrderBySortOrderAscIdAsc(category.getId())
                    .stream()
                    .map(Category::getId)
                    .toList();
            if (!childIds.isEmpty()) {
                targetIds.addAll(childIds);
            }
            return targetIds;
        }
        return List.of(category.getId());
    }

}
