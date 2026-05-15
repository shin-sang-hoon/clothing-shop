package com.example.demo.catalog.item.application;

import com.example.demo.catalog.brand.domain.Brand;
import com.example.demo.catalog.brand.domain.BrandFilterMap;
import com.example.demo.catalog.brand.domain.BrandFilterMapRepository;
import com.example.demo.catalog.brand.domain.BrandTagMap;
import com.example.demo.catalog.brand.domain.BrandTagMapRepository;
import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryFilterMap;
import com.example.demo.catalog.category.domain.CategoryFilterMapRepository;
import com.example.demo.catalog.category.domain.CategoryTagMap;
import com.example.demo.catalog.category.domain.CategoryTagMapRepository;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemFilterRepository;
import com.example.demo.trade.domain.ItemOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemFilterTagSyncService {

    private final CategoryFilterMapRepository categoryFilterMapRepository;
    private final BrandFilterMapRepository brandFilterMapRepository;
    private final CategoryTagMapRepository categoryTagMapRepository;
    private final BrandTagMapRepository brandTagMapRepository;
    private final ItemFilterRepository itemFilterRepository;
    private final ItemOptionRepository itemOptionRepository;
    private final FilterRepository filterRepository;

    /**
     * 아이템 삭제 후 호출 - 해당 카테고리/브랜드의 매핑 테이블 재빌드
     * (item_filter, item_option 삭제 완료 후 호출해야 정확한 카운트 반영)
     */
    @Transactional
    public void syncAfterDelete(Long categoryId, Long brandId) {
        if (categoryId != null) {
            rebuildCategory(categoryId);
        }
        if (brandId != null) {
            rebuildBrand(brandId);
        }
    }

    @Transactional
    public void syncForItem(Item item, Long previousCategoryId, Long previousBrandId) {
        if (previousCategoryId != null && (item.getCategory() == null || !previousCategoryId.equals(item.getCategory().getId()))) {
            rebuildCategory(previousCategoryId);
        }
        if (previousBrandId != null && (item.getBrand() == null || !previousBrandId.equals(item.getBrand().getId()))) {
            rebuildBrand(previousBrandId);
        }

        if (item.getCategory() != null && item.getCategory().getId() != null) {
            rebuildCategory(item.getCategory().getId());
        }
        if (item.getBrand() != null && item.getBrand().getId() != null) {
            rebuildBrand(item.getBrand().getId());
        }
    }

    private void rebuildCategory(Long categoryId) {
        Map<Long, Integer> counts = mergeCounts(
                itemFilterRepository.countDistinctItemsByCategoryId(categoryId),
                itemOptionRepository.countDistinctItemsByCategoryId(categoryId)
        );
        rebuildCategoryFilterMap(categoryId, counts);
        rebuildCategoryTagMap(categoryId, counts);
    }

    private void rebuildCategoryFilterMap(Long categoryId, Map<Long, Integer> counts) {
        List<Long> orderedFilterIds = sortFilterIdsByUsage(counts);
        List<Long> existingFilterIds = categoryFilterMapRepository
                .findByCategoryIdOrderBySortOrderAscIdAsc(categoryId)
                .stream()
                .map(map -> map.getFilter().getId())
                .toList();

        if (existingFilterIds.equals(orderedFilterIds)) {
            return;
        }

        categoryFilterMapRepository.deleteByCategoryId(categoryId);
        if (orderedFilterIds.isEmpty()) {
            return;
        }

        Category category = new Category();
        category.setId(categoryId);
        Map<Long, Filter> filtersById = loadFilters(new LinkedHashSet<>(orderedFilterIds));
        int sortOrder = 0;
        for (Long filterId : orderedFilterIds) {
            Filter filter = filtersById.get(filterId);
            if (filter == null) {
                continue;
            }

            CategoryFilterMap map = new CategoryFilterMap();
            map.setCategory(category);
            map.setFilter(filter);
            map.setSortOrder(sortOrder++);
            map.setUseYn(true);
            categoryFilterMapRepository.save(map);
        }
    }

    private void rebuildCategoryTagMap(Long categoryId, Map<Long, Integer> counts) {

        Map<Long, Integer> existingCounts = categoryTagMapRepository
                .findByCategoryIdOrderByItemCountDescIdAsc(categoryId)
                .stream()
                .collect(Collectors.toMap(
                        map -> map.getTag().getId(),
                        CategoryTagMap::getItemCount,
                        (left, right) -> right
                ));

        if (existingCounts.equals(counts)) {
            return;
        }

        categoryTagMapRepository.deleteByCategoryId(categoryId);
        if (counts.isEmpty()) {
            return;
        }

        Category category = new Category();
        category.setId(categoryId);
        Map<Long, Filter> filtersById = loadFilters(counts.keySet());
        for (Map.Entry<Long, Integer> entry : counts.entrySet()) {
            Filter filter = filtersById.get(entry.getKey());
            if (filter == null) {
                continue;
            }

            CategoryTagMap map = new CategoryTagMap();
            map.setCategory(category);
            map.setTag(filter);
            map.setItemCount(entry.getValue());
            categoryTagMapRepository.save(map);
        }
    }

    private void rebuildBrand(Long brandId) {
        Map<Long, Integer> counts = mergeCounts(
                itemFilterRepository.countDistinctItemsByBrandId(brandId),
                itemOptionRepository.countDistinctItemsByBrandId(brandId)
        );
        rebuildBrandFilterMap(brandId, counts);
        rebuildBrandTagMap(brandId, counts);
    }

    private void rebuildBrandFilterMap(Long brandId, Map<Long, Integer> counts) {
        List<Long> orderedFilterIds = sortFilterIdsByUsage(counts);
        List<Long> existingFilterIds = brandFilterMapRepository
                .findByBrandIdOrderBySortOrderAscIdAsc(brandId)
                .stream()
                .map(map -> map.getFilter().getId())
                .toList();

        if (existingFilterIds.equals(orderedFilterIds)) {
            return;
        }

        brandFilterMapRepository.deleteByBrandId(brandId);
        if (orderedFilterIds.isEmpty()) {
            return;
        }

        Brand brand = new Brand();
        brand.setId(brandId);
        Map<Long, Filter> filtersById = loadFilters(new LinkedHashSet<>(orderedFilterIds));
        int sortOrder = 0;
        for (Long filterId : orderedFilterIds) {
            Filter filter = filtersById.get(filterId);
            if (filter == null) {
                continue;
            }

            BrandFilterMap map = new BrandFilterMap();
            map.setBrand(brand);
            map.setFilter(filter);
            map.setSortOrder(sortOrder++);
            map.setUseYn(true);
            brandFilterMapRepository.save(map);
        }
    }

    private void rebuildBrandTagMap(Long brandId, Map<Long, Integer> counts) {

        Map<Long, Integer> existingCounts = brandTagMapRepository
                .findByBrandIdOrderByItemCountDescIdAsc(brandId)
                .stream()
                .collect(Collectors.toMap(
                        map -> map.getTag().getId(),
                        BrandTagMap::getItemCount,
                        (left, right) -> right
                ));

        if (existingCounts.equals(counts)) {
            return;
        }

        brandTagMapRepository.deleteByBrandId(brandId);
        if (counts.isEmpty()) {
            return;
        }

        Brand brand = new Brand();
        brand.setId(brandId);
        Map<Long, Filter> filtersById = loadFilters(counts.keySet());
        for (Map.Entry<Long, Integer> entry : counts.entrySet()) {
            Filter filter = filtersById.get(entry.getKey());
            if (filter == null) {
                continue;
            }

            BrandTagMap map = new BrandTagMap();
            map.setBrand(brand);
            map.setTag(filter);
            map.setItemCount(entry.getValue());
            brandTagMapRepository.save(map);
        }
    }

    private Map<Long, Integer> mergeCounts(
            List<ItemFilterRepository.TagUsageCount> filterCounts,
            List<ItemOptionRepository.TagUsageCount> optionCounts
    ) {
        Map<Long, Integer> merged = new LinkedHashMap<>();
        for (ItemFilterRepository.TagUsageCount usageCount : filterCounts) {
            if (usageCount.getTagId() == null || usageCount.getItemCount() == null) {
                continue;
            }
            merged.merge(usageCount.getTagId(), usageCount.getItemCount().intValue(), Integer::sum);
        }
        for (ItemOptionRepository.TagUsageCount usageCount : optionCounts) {
            if (usageCount.getTagId() == null || usageCount.getItemCount() == null) {
                continue;
            }
            merged.merge(usageCount.getTagId(), usageCount.getItemCount().intValue(), Integer::sum);
        }
        return merged;
    }

    private List<Long> sortFilterIdsByUsage(Map<Long, Integer> counts) {
        return counts.entrySet().stream()
                .sorted((left, right) -> {
                    int byCount = Integer.compare(right.getValue(), left.getValue());
                    if (byCount != 0) {
                        return byCount;
                    }
                    return Long.compare(left.getKey(), right.getKey());
                })
                .map(Map.Entry::getKey)
                .toList();
    }

    private Map<Long, Filter> loadFilters(Set<Long> filterIds) {
        if (filterIds == null || filterIds.isEmpty()) {
            return Map.of();
        }

        Set<Long> distinctFilterIds = new LinkedHashSet<>(filterIds);
        Map<Long, Filter> filtersById = new LinkedHashMap<>();
        for (Filter filter : filterRepository.findAllById(distinctFilterIds)) {
            filtersById.put(filter.getId(), filter);
        }
        return filtersById;
    }
}
