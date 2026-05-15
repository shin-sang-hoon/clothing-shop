package com.example.demo.catalog.filter.application;

import com.example.demo.catalog.brand.domain.BrandFilterMapRepository;
import com.example.demo.catalog.brand.domain.BrandTagMapRepository;
import com.example.demo.catalog.category.domain.CategoryFilterMapRepository;
import com.example.demo.catalog.category.domain.CategoryTagGroupMapRepository;
import com.example.demo.catalog.category.domain.CategoryTagMapRepository;
import com.example.demo.catalog.filter.domain.FilterGroup;
import com.example.demo.catalog.filter.domain.FilterGroupRepository;
import com.example.demo.catalog.filter.domain.FilterGroupRole;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.filter.dto.AdminFilterGroupDtos;
import com.example.demo.catalog.item.domain.ItemFilterRepository;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.global.util.AdminPageSupport;
import com.example.demo.trade.domain.ItemOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FilterGroupService {

    private final FilterGroupRepository filterGroupRepository;
    private final FilterRepository filterRepository;
    private final ItemFilterRepository itemFilterRepository;
    private final CategoryTagGroupMapRepository categoryTagGroupMapRepository;
    private final ItemOptionRepository itemOptionRepository;
    private final BrandFilterMapRepository brandFilterMapRepository;
    private final CategoryFilterMapRepository categoryFilterMapRepository;
    private final CategoryTagMapRepository categoryTagMapRepository;
    private final BrandTagMapRepository brandTagMapRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminFilterGroupDtos.FilterGroupListResponse> getFilterGroups(
            int page,
            int size,
            String keyword,
            Boolean multiSelectYn,
            Boolean useYn
    ) {
        Pageable pageable = AdminPageSupport.createPageable(page, size, 10);

        List<AdminFilterGroupDtos.FilterGroupListResponse> filteredContent = filterGroupRepository.findAll(
                        Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id"))
                ).stream()
                .filter(filterGroup -> matchesKeyword(filterGroup, keyword))
                .filter(filterGroup -> matchesMultiSelectYn(filterGroup, multiSelectYn))
                .filter(filterGroup -> matchesUseYn(filterGroup, useYn))
                .map(this::toListResponse)
                .toList();

        return AdminPageSupport.toPageResponse(filteredContent, pageable);
    }

    @Transactional(readOnly = true)
    public AdminFilterGroupDtos.FilterGroupDetailResponse getFilterGroup(Long filterGroupId) {
        FilterGroup filterGroup = filterGroupRepository.findById(filterGroupId)
                .orElseThrow(() -> new IllegalArgumentException("필터 그룹을 찾을 수 없습니다. id=" + filterGroupId));
        return toDetailResponse(filterGroup);
    }

    @Transactional(readOnly = true)
    public List<AdminFilterGroupDtos.FilterGroupWithFiltersResponse> getFilterGroupsWithFilters() {
        return filterGroupRepository.findAll(
                        Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id"))
                ).stream()
                .filter(FilterGroup::isUseYn)
                .map(filterGroup -> new AdminFilterGroupDtos.FilterGroupWithFiltersResponse(
                        filterGroup.getId(),
                        filterGroup.getName(),
                        filterGroup.getCode(),
                        filterGroup.isMultiSelectYn(),
                        resolveRole(filterGroup.getRole()),
                        filterGroup.getSortOrder(),
                        filterGroup.isUseYn(),
                        filterRepository.findByFilterGroupIdAndUseYnTrueOrderBySortOrderAscIdAsc(filterGroup.getId()).stream()
                                .map(filter -> new AdminFilterGroupDtos.FilterSummary(
                                        filter.getId(),
                                        filter.getName(),
                                        filter.getCode(),
                                        filter.getColorHex(),
                                        filter.getIconImageUrl()
                                ))
                                .toList()
                ))
                .toList();
    }

    @Transactional
    public AdminFilterGroupDtos.FilterGroupDetailResponse createFilterGroup(
            AdminFilterGroupDtos.CreateFilterGroupRequest req
    ) {
        validateDuplicateCode(null, req.code());
        validateDuplicateName(null, req.name());

        FilterGroup filterGroup = new FilterGroup();
        applyFilterGroupFields(
                filterGroup,
                req.name(),
                req.code(),
                req.multiSelectYn(),
                req.role(),
                req.sortOrder(),
                req.useYn(),
                req.description()
        );

        return toDetailResponse(filterGroupRepository.save(filterGroup));
    }

    @Transactional
    public AdminFilterGroupDtos.FilterGroupDetailResponse updateFilterGroup(
            Long filterGroupId,
            AdminFilterGroupDtos.UpdateFilterGroupRequest req
    ) {
        FilterGroup filterGroup = filterGroupRepository.findById(filterGroupId)
                .orElseThrow(() -> new IllegalArgumentException("필터 그룹을 찾을 수 없습니다. id=" + filterGroupId));

        validateDuplicateCode(filterGroupId, req.code());
        validateDuplicateName(filterGroupId, req.name());

        applyFilterGroupFields(
                filterGroup,
                req.name(),
                req.code(),
                req.multiSelectYn(),
                req.role(),
                req.sortOrder(),
                req.useYn(),
                req.description()
        );

        return toDetailResponse(filterGroup);
    }

    @Transactional
    public AdminFilterGroupDtos.FilterGroupDetailResponse updateUseYn(
            Long filterGroupId,
            AdminFilterGroupDtos.UpdateFilterGroupUseRequest req
    ) {
        FilterGroup filterGroup = filterGroupRepository.findById(filterGroupId)
                .orElseThrow(() -> new IllegalArgumentException("필터 그룹을 찾을 수 없습니다. id=" + filterGroupId));

        filterGroup.setUseYn(Boolean.TRUE.equals(req.useYn()));
        return toDetailResponse(filterGroup);
    }

    @Transactional
    public void deleteFilterGroup(Long filterGroupId) {
        if (!filterGroupRepository.existsById(filterGroupId)) {
            throw new IllegalArgumentException("필터 그룹을 찾을 수 없습니다. id=" + filterGroupId);
        }

        itemOptionRepository.nullifySourceTagByFilterGroupId(filterGroupId);
        itemFilterRepository.deleteByTagFilterGroupId(filterGroupId);
        brandFilterMapRepository.deleteByFilterFilterGroupId(filterGroupId);
        categoryFilterMapRepository.deleteByFilterFilterGroupId(filterGroupId);
        categoryTagMapRepository.deleteByTagFilterGroupId(filterGroupId);
        brandTagMapRepository.deleteByTagFilterGroupId(filterGroupId);
        categoryTagGroupMapRepository.deleteByTagGroupId(filterGroupId);
        filterRepository.deleteByFilterGroupId(filterGroupId);
        filterGroupRepository.deleteById(filterGroupId);
    }

    private void applyFilterGroupFields(
            FilterGroup filterGroup,
            String name,
            String code,
            Boolean multiSelectYn,
            FilterGroupRole role,
            Integer sortOrder,
            Boolean useYn,
            String description
    ) {
        filterGroup.setName(normalizeName(name));
        filterGroup.setCode(normalizeCode(code));
        filterGroup.setMultiSelectYn(Boolean.TRUE.equals(multiSelectYn));
        filterGroup.setRole(resolveRole(role));
        filterGroup.setSortOrder(sortOrder != null ? sortOrder : 0);
        filterGroup.setUseYn(Boolean.TRUE.equals(useYn));
        filterGroup.setDescription(normalizeNullableText(description));
    }

    private void validateDuplicateCode(Long filterGroupId, String rawCode) {
        String normalizedCode = normalizeCode(rawCode);
        filterGroupRepository.findByCode(normalizedCode).ifPresent(found -> {
            if (filterGroupId == null || !found.getId().equals(filterGroupId)) {
                throw new IllegalArgumentException("이미 사용 중인 필터 그룹 코드입니다.");
            }
        });
    }

    private void validateDuplicateName(Long filterGroupId, String rawName) {
        String normalizedName = normalizeName(rawName);

        boolean duplicated = filterGroupRepository.findAll().stream()
                .anyMatch(filterGroup ->
                        filterGroup.getName().equalsIgnoreCase(normalizedName)
                                && (filterGroupId == null || !filterGroup.getId().equals(filterGroupId))
                );

        if (duplicated) {
            throw new IllegalArgumentException("이미 사용 중인 필터 그룹명입니다.");
        }
    }

    private boolean matchesKeyword(FilterGroup filterGroup, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        String normalizedKeyword = keyword.trim().toLowerCase();
        return filterGroup.getName().toLowerCase().contains(normalizedKeyword)
                || filterGroup.getCode().toLowerCase().contains(normalizedKeyword);
    }

    private boolean matchesMultiSelectYn(FilterGroup filterGroup, Boolean multiSelectYn) {
        return multiSelectYn == null || filterGroup.isMultiSelectYn() == multiSelectYn;
    }

    private boolean matchesUseYn(FilterGroup filterGroup, Boolean useYn) {
        return useYn == null || filterGroup.isUseYn() == useYn;
    }

    private AdminFilterGroupDtos.FilterGroupListResponse toListResponse(FilterGroup filterGroup) {
        return new AdminFilterGroupDtos.FilterGroupListResponse(
                filterGroup.getId(),
                filterGroup.getName(),
                filterGroup.getCode(),
                filterGroup.isMultiSelectYn(),
                resolveRole(filterGroup.getRole()),
                filterGroup.getSortOrder(),
                filterGroup.isUseYn(),
                filterGroup.getDescription(),
                ApiDateTimeConverter.toUtcString(filterGroup.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(filterGroup.getUpdatedAt())
        );
    }

    private AdminFilterGroupDtos.FilterGroupDetailResponse toDetailResponse(FilterGroup filterGroup) {
        return new AdminFilterGroupDtos.FilterGroupDetailResponse(
                filterGroup.getId(),
                filterGroup.getName(),
                filterGroup.getCode(),
                filterGroup.isMultiSelectYn(),
                resolveRole(filterGroup.getRole()),
                filterGroup.getSortOrder(),
                filterGroup.isUseYn(),
                filterGroup.getDescription(),
                ApiDateTimeConverter.toUtcString(filterGroup.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(filterGroup.getUpdatedAt())
        );
    }

    private String normalizeName(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeCode(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replace(" ", "_").toUpperCase();
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private FilterGroupRole resolveRole(FilterGroupRole role) {
        return role != null ? role : FilterGroupRole.ALL;
    }
}
