package com.example.demo.catalog.mapping.application;

import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryDisplayTagMap;
import com.example.demo.catalog.category.domain.CategoryDisplayTagMapRepository;
import com.example.demo.catalog.category.domain.CategoryFilterMap;
import com.example.demo.catalog.category.domain.CategoryFilterMapRepository;
import com.example.demo.catalog.category.domain.CategoryRepository;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterGroup;
import com.example.demo.catalog.mapping.dto.ShopMappingDtos;
import com.example.demo.catalog.tag.domain.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ShopMappingService {

    private final CategoryRepository categoryRepository;
    private final CategoryFilterMapRepository categoryFilterMapRepository;
    private final CategoryDisplayTagMapRepository categoryDisplayTagMapRepository;

    @Transactional(readOnly = true)
    public ShopMappingDtos.CategoryDisplayMappingResponse getCategoryDisplayMapping(String categoryCode) {
        Category category = categoryRepository.findByCode(categoryCode)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다. code=" + categoryCode));

        List<Long> targetCategoryIds = resolveTargetCategoryIds(category);
        List<CategoryFilterMap> filterMaps = targetCategoryIds.size() == 1
                ? categoryFilterMapRepository.findByCategoryIdOrderBySortOrderAscIdAsc(targetCategoryIds.get(0))
                : categoryFilterMapRepository.findByCategoryIdInOrderBySortOrderAscIdAsc(targetCategoryIds);

        Map<Long, ShopMappingDtos.DisplayFilterGroup> grouped = new LinkedHashMap<>();
        Set<Long> addedFilterIds = new HashSet<>();

        for (CategoryFilterMap map : filterMaps) {
            if (!map.isUseYn()) {
                continue;
            }

            Filter filter = map.getFilter();
            if (filter == null || !filter.isUseYn()) {
                continue;
            }
            if (!addedFilterIds.add(filter.getId())) {
                continue;
            }

            FilterGroup filterGroup = filter.getFilterGroup();
            if (filterGroup == null || !filterGroup.isUseYn()) {
                continue;
            }

            ShopMappingDtos.DisplayFilterGroup existing = grouped.get(filterGroup.getId());
            if (existing == null) {
                grouped.put(
                        filterGroup.getId(),
                        new ShopMappingDtos.DisplayFilterGroup(
                                filterGroup.getId(),
                                filterGroup.getName(),
                                filterGroup.getCode(),
                                new ArrayList<>()
                        )
                );
                existing = grouped.get(filterGroup.getId());
            }

            ((ArrayList<ShopMappingDtos.DisplayFilter>) existing.filters()).add(
                    new ShopMappingDtos.DisplayFilter(
                            filter.getId(),
                            filter.getName(),
                            filter.getCode(),
                            filter.getColorHex()
                    )
            );
        }

        List<CategoryDisplayTagMap> tagMaps = targetCategoryIds.size() == 1
                ? categoryDisplayTagMapRepository.findByCategoryIdOrderBySortOrderAscIdAsc(targetCategoryIds.get(0))
                : categoryDisplayTagMapRepository.findByCategoryIdInOrderBySortOrderAscIdAsc(targetCategoryIds);

        Set<Long> addedTagIds = new HashSet<>();
        List<ShopMappingDtos.DisplayTag> tags = tagMaps.stream()
                .filter(CategoryDisplayTagMap::isUseYn)
                .map(CategoryDisplayTagMap::getTag)
                .filter(tag -> tag != null && tag.isUseYn())
                .filter(tag -> addedTagIds.add(tag.getId()))
                .map(this::toDisplayTag)
                .toList();

        return new ShopMappingDtos.CategoryDisplayMappingResponse(
                category.getId(),
                category.getName(),
                category.getCode(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getParent() != null ? category.getParent().getCode() : null,
                List.copyOf(grouped.values()),
                tags
        );
    }

    private ShopMappingDtos.DisplayTag toDisplayTag(Tag tag) {
        return new ShopMappingDtos.DisplayTag(
                tag.getId(),
                tag.getName(),
                tag.getCode()
        );
    }

    private List<Long> resolveTargetCategoryIds(Category category) {
        if (category.getDepth() != null && category.getDepth() == 1) {
            List<Long> targetIds = new ArrayList<>();
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
