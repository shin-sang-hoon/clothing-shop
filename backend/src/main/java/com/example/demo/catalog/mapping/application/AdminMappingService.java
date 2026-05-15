package com.example.demo.catalog.mapping.application;

import com.example.demo.catalog.brand.domain.*;
import com.example.demo.catalog.category.domain.*;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.item.domain.ItemFilterRepository;
import com.example.demo.catalog.item.domain.ItemTagRepository;
import com.example.demo.catalog.mapping.dto.AdminMappingDtos;
import com.example.demo.catalog.tag.domain.Tag;
import com.example.demo.catalog.tag.domain.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminMappingService {

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final FilterRepository filterRepository;
    private final TagRepository tagRepository;
    private final ItemFilterRepository itemFilterRepository;
    private final ItemTagRepository itemTagRepository;
    private final CategoryFilterMapRepository categoryFilterMapRepository;
    private final BrandFilterMapRepository brandFilterMapRepository;
    private final CategoryDisplayTagMapRepository categoryDisplayTagMapRepository;
    private final BrandDisplayTagMapRepository brandDisplayTagMapRepository;

    @Transactional(readOnly = true)
    public AdminMappingDtos.MappingDetailResponse getCategoryMapping(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다. id=" + categoryId));

        List<AdminMappingDtos.MappingItem> filters = categoryFilterMapRepository
                .findByCategoryIdOrderBySortOrderAscIdAsc(categoryId)
                .stream()
                .map(map -> toMappingItem(map.getFilter()))
                .toList();

        List<AdminMappingDtos.MappingItem> tags = categoryDisplayTagMapRepository
                .findByCategoryIdOrderBySortOrderAscIdAsc(categoryId)
                .stream()
                .map(map -> toMappingItem(map.getTag()))
                .toList();

        return new AdminMappingDtos.MappingDetailResponse(
                category.getId(),
                category.getName(),
                filters,
                tags
        );
    }

    @Transactional
    public AdminMappingDtos.MappingDetailResponse updateCategoryMapping(
            Long categoryId,
            AdminMappingDtos.UpdateMappingRequest req
    ) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다. id=" + categoryId));

        categoryFilterMapRepository.deleteByCategoryId(categoryId);
        categoryDisplayTagMapRepository.deleteByCategoryId(categoryId);

        List<Filter> filters = loadFilters(req.filterIds());
        for (int i = 0; i < filters.size(); i++) {
            CategoryFilterMap map = new CategoryFilterMap();
            map.setCategory(category);
            map.setFilter(filters.get(i));
            map.setSortOrder(i);
            map.setUseYn(true);
            categoryFilterMapRepository.save(map);
        }

        List<Tag> tags = loadTags(req.tagIds());
        for (int i = 0; i < tags.size(); i++) {
            CategoryDisplayTagMap map = new CategoryDisplayTagMap();
            map.setCategory(category);
            map.setTag(tags.get(i));
            map.setSortOrder(i);
            map.setUseYn(true);
            categoryDisplayTagMapRepository.save(map);
        }

        return getCategoryMapping(categoryId);
    }

    @Transactional
    public AdminMappingDtos.MappingDetailResponse autoMapCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다. id=" + categoryId));
        autoMapCategory(category);

        return getCategoryMapping(categoryId);
    }

    @Transactional
    public AdminMappingDtos.BulkAutoSyncResponse autoMapAllCategories() {
        List<Category> categories = categoryRepository.findByUseYnTrueOrderBySortOrderAscIdAsc();
        categoryFilterMapRepository.deleteAllInBatch();
        categoryDisplayTagMapRepository.deleteAllInBatch();
        for (Category category : categories) {
            autoMapCategory(category);
        }
        return new AdminMappingDtos.BulkAutoSyncResponse(categories.size(), "CATEGORY");
    }

    @Transactional(readOnly = true)
    public AdminMappingDtos.MappingDetailResponse getBrandMapping(Long brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId));

        List<AdminMappingDtos.MappingItem> filters = brandFilterMapRepository
                .findByBrandIdOrderBySortOrderAscIdAsc(brandId)
                .stream()
                .map(map -> toMappingItem(map.getFilter()))
                .toList();

        List<AdminMappingDtos.MappingItem> tags = brandDisplayTagMapRepository
                .findByBrandIdOrderBySortOrderAscIdAsc(brandId)
                .stream()
                .map(map -> toMappingItem(map.getTag()))
                .toList();

        return new AdminMappingDtos.MappingDetailResponse(
                brand.getId(),
                brand.getNameKo(),
                filters,
                tags
        );
    }

    @Transactional
    public AdminMappingDtos.MappingDetailResponse updateBrandMapping(
            Long brandId,
            AdminMappingDtos.UpdateMappingRequest req
    ) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId));

        brandFilterMapRepository.deleteByBrandId(brandId);
        brandDisplayTagMapRepository.deleteByBrandId(brandId);

        List<Filter> filters = loadFilters(req.filterIds());
        for (int i = 0; i < filters.size(); i++) {
            BrandFilterMap map = new BrandFilterMap();
            map.setBrand(brand);
            map.setFilter(filters.get(i));
            map.setSortOrder(i);
            map.setUseYn(true);
            brandFilterMapRepository.save(map);
        }

        List<Tag> tags = loadTags(req.tagIds());
        for (int i = 0; i < tags.size(); i++) {
            BrandDisplayTagMap map = new BrandDisplayTagMap();
            map.setBrand(brand);
            map.setTag(tags.get(i));
            map.setSortOrder(i);
            map.setUseYn(true);
            brandDisplayTagMapRepository.save(map);
        }

        return getBrandMapping(brandId);
    }

    @Transactional
    public AdminMappingDtos.MappingDetailResponse autoMapBrand(Long brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId));
        autoMapBrand(brand);

        return getBrandMapping(brandId);
    }

    @Transactional
    public AdminMappingDtos.BulkAutoSyncResponse autoMapAllBrands() {
        List<Brand> brands = brandRepository.findByUseYnTrueOrderBySortOrderAscIdAsc();
        brandFilterMapRepository.deleteAllInBatch();
        brandDisplayTagMapRepository.deleteAllInBatch();
        for (Brand brand : brands) {
            autoMapBrand(brand);
        }
        return new AdminMappingDtos.BulkAutoSyncResponse(brands.size(), "BRAND");
    }

    private List<Filter> loadFilters(List<Long> filterIds) {
        Set<Long> orderedIds = normalizeIds(filterIds);
        if (orderedIds.isEmpty()) {
            return List.of();
        }

        List<Filter> found = filterRepository.findAllById(orderedIds);
        List<Filter> ordered = new ArrayList<>();
        for (Long filterId : orderedIds) {
            found.stream()
                    .filter(filter -> filter.getId().equals(filterId))
                    .findFirst()
                    .ifPresent(ordered::add);
        }
        return ordered;
    }

    private List<Tag> loadTags(List<Long> tagIds) {
        Set<Long> orderedIds = normalizeIds(tagIds);
        if (orderedIds.isEmpty()) {
            return List.of();
        }

        List<Tag> found = tagRepository.findAllById(orderedIds);
        List<Tag> ordered = new ArrayList<>();
        for (Long tagId : orderedIds) {
            found.stream()
                    .filter(tag -> tag.getId().equals(tagId))
                    .findFirst()
                    .ifPresent(ordered::add);
        }
        return ordered;
    }

    private Set<Long> normalizeIds(List<Long> ids) {
        Set<Long> ordered = new LinkedHashSet<>();
        if (ids == null) {
            return ordered;
        }

        for (Long id : ids) {
            if (id != null) {
                ordered.add(id);
            }
        }
        return ordered;
    }

    private AdminMappingDtos.MappingItem toMappingItem(Filter filter) {
        return new AdminMappingDtos.MappingItem(
                filter.getId(),
                filter.getName(),
                filter.getCode(),
                filter.getSortOrder(),
                filter.isUseYn()
        );
    }

    private AdminMappingDtos.MappingItem toMappingItem(Tag tag) {
        return new AdminMappingDtos.MappingItem(
                tag.getId(),
                tag.getName(),
                tag.getCode(),
                tag.getSortOrder(),
                tag.isUseYn()
        );
    }

    private int compareUsageCount(Long leftCount, Long rightCount, Long leftId, Long rightId) {
        int countCompare = Long.compare(
                rightCount == null ? 0L : rightCount,
                leftCount == null ? 0L : leftCount
        );
        if (countCompare != 0) {
            return countCompare;
        }
        return Long.compare(leftId == null ? 0L : leftId, rightId == null ? 0L : rightId);
    }

    private void autoMapCategory(Category category) {
        Long categoryId = category.getId();
        categoryFilterMapRepository.deleteByCategoryId(categoryId);
        categoryDisplayTagMapRepository.deleteByCategoryId(categoryId);

        List<Filter> filters = loadFilters(
                itemFilterRepository.countDistinctItemsByCategoryId(categoryId).stream()
                        .sorted((a, b) -> compareUsageCount(a.getItemCount(), b.getItemCount(), a.getTagId(), b.getTagId()))
                        .map(ItemFilterRepository.TagUsageCount::getTagId)
                        .toList()
        );
        for (int i = 0; i < filters.size(); i++) {
            CategoryFilterMap map = new CategoryFilterMap();
            map.setCategory(category);
            map.setFilter(filters.get(i));
            map.setSortOrder(i);
            map.setUseYn(true);
            categoryFilterMapRepository.save(map);
        }

        List<Tag> tags = loadTags(
                itemTagRepository.countDistinctItemsByCategoryId(categoryId).stream()
                        .sorted((a, b) -> compareUsageCount(a.getItemCount(), b.getItemCount(), a.getTagId(), b.getTagId()))
                        .map(ItemTagRepository.TagUsageCount::getTagId)
                        .toList()
        );
        for (int i = 0; i < tags.size(); i++) {
            CategoryDisplayTagMap map = new CategoryDisplayTagMap();
            map.setCategory(category);
            map.setTag(tags.get(i));
            map.setSortOrder(i);
            map.setUseYn(true);
            categoryDisplayTagMapRepository.save(map);
        }
    }

    private void autoMapBrand(Brand brand) {
        Long brandId = brand.getId();
        brandFilterMapRepository.deleteByBrandId(brandId);
        brandDisplayTagMapRepository.deleteByBrandId(brandId);

        List<Filter> filters = loadFilters(
                itemFilterRepository.countDistinctItemsByBrandId(brandId).stream()
                        .sorted((a, b) -> compareUsageCount(a.getItemCount(), b.getItemCount(), a.getTagId(), b.getTagId()))
                        .map(ItemFilterRepository.TagUsageCount::getTagId)
                        .toList()
        );
        for (int i = 0; i < filters.size(); i++) {
            BrandFilterMap map = new BrandFilterMap();
            map.setBrand(brand);
            map.setFilter(filters.get(i));
            map.setSortOrder(i);
            map.setUseYn(true);
            brandFilterMapRepository.save(map);
        }

        List<Tag> tags = loadTags(
                itemTagRepository.countDistinctItemsByBrandId(brandId).stream()
                        .sorted((a, b) -> compareUsageCount(a.getItemCount(), b.getItemCount(), a.getTagId(), b.getTagId()))
                        .map(ItemTagRepository.TagUsageCount::getTagId)
                        .toList()
        );
        for (int i = 0; i < tags.size(); i++) {
            BrandDisplayTagMap map = new BrandDisplayTagMap();
            map.setBrand(brand);
            map.setTag(tags.get(i));
            map.setSortOrder(i);
            map.setUseYn(true);
            brandDisplayTagMapRepository.save(map);
        }
    }
}
