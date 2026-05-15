package com.example.demo.catalog.category.application;

import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryRepository;
import com.example.demo.catalog.category.domain.CategoryTagGroupMap;
import com.example.demo.catalog.category.domain.CategoryTagGroupMapRepository;
import com.example.demo.catalog.category.dto.AdminCategoryDtos;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterGroup;
import com.example.demo.catalog.filter.domain.FilterGroupRole;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryTagGroupMapRepository categoryTagGroupMapRepository;
    private final ItemRepository itemRepository;
    private final FilterRepository filterRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminCategoryDtos.CategoryListResponse> getCategories(
            int page,
            int size,
            String keyword,
            Boolean useYn
    ) {
        Pageable pageable = createPageable(page, size);

        List<AdminCategoryDtos.CategoryListResponse> filteredContent = categoryRepository.findAll(
                        Sort.by(Sort.Order.asc("depth"), Sort.Order.asc("sortOrder"), Sort.Order.asc("id"))
                ).stream()
                .filter(category -> matchesKeyword(category, keyword))
                .filter(category -> matchesUseYn(category, useYn))
                .map(this::toListResponse)
                .toList();

        return toPageResponse(filteredContent, pageable);
    }

    @Transactional(readOnly = true)
    public AdminCategoryDtos.CategoryDetailResponse getCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다. id=" + categoryId));
        return toDetailResponse(category);
    }

    @Transactional
    public AdminCategoryDtos.CategoryDetailResponse createCategory(AdminCategoryDtos.CreateCategoryRequest req) {
        Category parent = resolveParent(req.parentId(), null);

        validateDuplicateCode(null, req.code());
        validateDuplicateName(null, parent, req.name());

        Category category = new Category();
        applyCategoryFields(
                category,
                req.name(),
                req.code(),
                parent,
                req.sortOrder(),
                req.useYn(),
                req.imageUrl(),
                req.description()
        );

        return toDetailResponse(categoryRepository.save(category));
    }

    @Transactional
    public AdminCategoryDtos.CategoryDetailResponse updateCategory(
            Long categoryId,
            AdminCategoryDtos.UpdateCategoryRequest req
    ) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다. id=" + categoryId));

        Category parent = resolveParent(req.parentId(), categoryId);

        validateDuplicateCode(categoryId, req.code());
        validateDuplicateName(categoryId, parent, req.name());

        applyCategoryFields(
                category,
                req.name(),
                req.code(),
                parent,
                req.sortOrder(),
                req.useYn(),
                req.imageUrl(),
                req.description()
        );

        return toDetailResponse(category);
    }

    @Transactional
    public AdminCategoryDtos.CategoryDetailResponse updateUseYn(
            Long categoryId,
            AdminCategoryDtos.UpdateCategoryUseRequest req
    ) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다. id=" + categoryId));

        category.setUseYn(req.useYn());
        return toDetailResponse(category);
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new IllegalArgumentException("카테고리를 찾을 수 없습니다. id=" + categoryId);
        }
        itemRepository.nullifyCategoryId(categoryId);
        categoryTagGroupMapRepository.deleteByCategoryId(categoryId);
        categoryRepository.deleteById(categoryId);
    }

    @Transactional(readOnly = true)
    public List<AdminCategoryDtos.CategoryFilterGroupResponse> getCategoryFilterGroups(Long categoryId) {
        List<CategoryTagGroupMap> maps = categoryTagGroupMapRepository.findByCategoryIdWithTagGroup(categoryId);

        return maps.stream()
                .map(map -> {
                    FilterGroup filterGroup = map.getTagGroup();
                    List<Filter> filters = filterRepository.findByFilterGroupIdAndUseYnTrueOrderBySortOrderAscIdAsc(filterGroup.getId());
                    List<AdminCategoryDtos.FilterInGroupResponse> filterResponses = filters.stream()
                            .map(filter -> new AdminCategoryDtos.FilterInGroupResponse(
                                    filter.getId(),
                                    filter.getName(),
                                    filter.getCode(),
                                    filter.getColorHex(),
                                    filter.getIconImageUrl()
                            ))
                            .toList();
                    return new AdminCategoryDtos.CategoryFilterGroupResponse(
                            filterGroup.getId(),
                            filterGroup.getName(),
                            filterGroup.getCode(),
                            filterGroup.isMultiSelectYn(),
                            filterGroup.getRole() != null ? filterGroup.getRole() : FilterGroupRole.ALL,
                            filterResponses
                    );
                })
                .toList();
    }

    private void applyCategoryFields(
            Category category,
            String name,
            String code,
            Category parent,
            Integer sortOrder,
            Boolean useYn,
            String imageUrl,
            String description
    ) {
        category.setName(normalizeName(name));
        category.setCode(normalizeCode(code));
        category.setParent(parent);
        category.setDepth(parent == null ? 1 : parent.getDepth() + 1);
        category.setSortOrder(sortOrder != null ? sortOrder : 0);
        category.setUseYn(Boolean.TRUE.equals(useYn));
        category.setImageUrl(normalizeNullableText(imageUrl));
        category.setDescription(normalizeNullableText(description));
    }

    private Category resolveParent(Long parentId, Long selfId) {
        if (parentId == null || parentId <= 0) {
            return null;
        }

        if (selfId != null && selfId.equals(parentId)) {
            throw new IllegalArgumentException("자기 자신을 부모 카테고리로 지정할 수 없습니다.");
        }

        return categoryRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("상위 카테고리를 찾을 수 없습니다. id=" + parentId));
    }

    private void validateDuplicateCode(Long categoryId, String rawCode) {
        String normalizedCode = normalizeCode(rawCode);

        categoryRepository.findByCode(normalizedCode).ifPresent(found -> {
            if (categoryId == null || !found.getId().equals(categoryId)) {
                throw new IllegalArgumentException("이미 사용 중인 카테고리 코드입니다.");
            }
        });
    }

    private void validateDuplicateName(Long categoryId, Category parent, String rawName) {
        String normalizedName = normalizeName(rawName);

        if (parent == null) {
            categoryRepository.findByParentIsNullAndNameIgnoreCase(normalizedName)
                    .ifPresent(found -> {
                        if (categoryId == null || !found.getId().equals(categoryId)) {
                            throw new IllegalArgumentException("같은 최상위 카테고리명이 이미 존재합니다.");
                        }
                    });
            return;
        }

        categoryRepository.findByParentIdAndNameIgnoreCase(parent.getId(), normalizedName)
                .ifPresent(found -> {
                    if (categoryId == null || !found.getId().equals(categoryId)) {
                        throw new IllegalArgumentException("같은 상위 카테고리 아래 동일한 이름이 이미 존재합니다.");
                    }
                });
    }

    private boolean matchesKeyword(Category category, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        String normalizedKeyword = keyword.trim().toLowerCase();

        return category.getName().toLowerCase().contains(normalizedKeyword)
                || category.getCode().toLowerCase().contains(normalizedKeyword)
                || (category.getParent() != null
                && category.getParent().getName() != null
                && category.getParent().getName().toLowerCase().contains(normalizedKeyword));
    }

    private boolean matchesUseYn(Category category, Boolean useYn) {
        return useYn == null || category.isUseYn() == useYn;
    }

    private AdminCategoryDtos.CategoryListResponse toListResponse(Category category) {
        return new AdminCategoryDtos.CategoryListResponse(
                category.getId(),
                category.getName(),
                category.getCode(),
                category.getDepth(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getParent() != null ? category.getParent().getName() : null,
                category.getSortOrder(),
                category.isUseYn(),
                category.getImageUrl(),
                category.getDescription(),
                ApiDateTimeConverter.toUtcString(category.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(category.getUpdatedAt())
        );
    }

    private AdminCategoryDtos.CategoryDetailResponse toDetailResponse(Category category) {
        return new AdminCategoryDtos.CategoryDetailResponse(
                category.getId(),
                category.getName(),
                category.getCode(),
                category.getDepth(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getParent() != null ? category.getParent().getName() : null,
                category.getSortOrder(),
                category.isUseYn(),
                category.getImageUrl(),
                category.getDescription(),
                ApiDateTimeConverter.toUtcString(category.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(category.getUpdatedAt())
        );
    }

    private Pageable createPageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), size <= 0 ? 10 : size);
    }

    private PageResponse<AdminCategoryDtos.CategoryListResponse> toPageResponse(
            List<AdminCategoryDtos.CategoryListResponse> content,
            Pageable pageable
    ) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), content.size());
        List<AdminCategoryDtos.CategoryListResponse> pageContent =
                start >= content.size() ? List.of() : content.subList(start, end);
        int totalPages = content.isEmpty() ? 0 : (int) Math.ceil((double) content.size() / pageable.getPageSize());

        return new PageResponse<>(
                pageContent,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                content.size(),
                totalPages,
                pageable.getPageNumber() == 0,
                totalPages == 0 || pageable.getPageNumber() >= totalPages - 1
        );
    }

    private String normalizeName(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("카테고리명은 비어 있을 수 없습니다.");
        }
        return normalized;
    }

    private String normalizeCode(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("카테고리 코드는 비어 있을 수 없습니다.");
        }
        return normalized;
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
