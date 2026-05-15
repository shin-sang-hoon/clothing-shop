package com.example.demo.catalog.filter.application;

import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterGroup;
import com.example.demo.catalog.filter.domain.FilterGroupRepository;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.filter.dto.AdminFilterDtos;
import com.example.demo.catalog.item.domain.ItemFilterRepository;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.global.util.AdminPageSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FilterService {

    private final FilterRepository filterRepository;
    private final FilterGroupRepository filterGroupRepository;
    private final ItemFilterRepository itemFilterRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminFilterDtos.FilterListResponse> getFilters(
            int page,
            int size,
            Long filterGroupId,
            String keyword,
            Boolean useYn
    ) {
        Pageable pageable = AdminPageSupport.createPageable(page, size, 10);

        List<AdminFilterDtos.FilterListResponse> filteredContent = filterRepository.findAll(
                        Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id"))
                ).stream()
                .filter(filter -> matchesFilterGroupId(filter, filterGroupId))
                .filter(filter -> matchesKeyword(filter, keyword))
                .filter(filter -> matchesUseYn(filter, useYn))
                .map(this::toListResponse)
                .toList();

        return AdminPageSupport.toPageResponse(filteredContent, pageable);
    }

    @Transactional(readOnly = true)
    public AdminFilterDtos.FilterDetailResponse getFilter(Long filterId) {
        Filter filter = filterRepository.findById(filterId)
                .orElseThrow(() -> new IllegalArgumentException("필터를 찾을 수 없습니다. id=" + filterId));
        return toDetailResponse(filter);
    }

    @Transactional
    public AdminFilterDtos.FilterDetailResponse createFilter(AdminFilterDtos.CreateFilterRequest req) {
        validateDuplicateCode(null, req.code());
        validateDuplicateName(null, req.filterGroupId(), req.name());

        Filter filter = new Filter();
        applyFilterFields(
                filter,
                req.filterGroupId(),
                req.name(),
                req.code(),
                req.sortOrder(),
                req.useYn(),
                req.colorHex(),
                req.iconImageUrl(),
                req.description()
        );

        return toDetailResponse(filterRepository.save(filter));
    }

    @Transactional
    public AdminFilterDtos.FilterDetailResponse updateFilter(
            Long filterId,
            AdminFilterDtos.UpdateFilterRequest req
    ) {
        Filter filter = filterRepository.findById(filterId)
                .orElseThrow(() -> new IllegalArgumentException("필터를 찾을 수 없습니다. id=" + filterId));

        validateDuplicateCode(filterId, req.code());
        validateDuplicateName(filterId, req.filterGroupId(), req.name());

        applyFilterFields(
                filter,
                req.filterGroupId(),
                req.name(),
                req.code(),
                req.sortOrder(),
                req.useYn(),
                req.colorHex(),
                req.iconImageUrl(),
                req.description()
        );

        return toDetailResponse(filter);
    }

    @Transactional
    public AdminFilterDtos.FilterDetailResponse updateUseYn(
            Long filterId,
            AdminFilterDtos.UpdateFilterUseRequest req
    ) {
        Filter filter = filterRepository.findById(filterId)
                .orElseThrow(() -> new IllegalArgumentException("필터를 찾을 수 없습니다. id=" + filterId));

        filter.setUseYn(Boolean.TRUE.equals(req.useYn()));
        return toDetailResponse(filter);
    }

    @Transactional
    public void deleteFilter(Long filterId) {
        if (!filterRepository.existsById(filterId)) {
            throw new IllegalArgumentException("필터를 찾을 수 없습니다. id=" + filterId);
        }

        itemFilterRepository.deleteByTagId(filterId);
        filterRepository.deleteById(filterId);
    }

    private void applyFilterFields(
            Filter filter,
            Long filterGroupId,
            String name,
            String code,
            Integer sortOrder,
            Boolean useYn,
            String colorHex,
            String iconImageUrl,
            String description
    ) {
        FilterGroup filterGroup = filterGroupRepository.findById(filterGroupId)
                .orElseThrow(() -> new IllegalArgumentException("필터 그룹을 찾을 수 없습니다. id=" + filterGroupId));

        filter.setFilterGroup(filterGroup);
        filter.setName(normalizeName(name));
        filter.setCode(normalizeCode(code));
        filter.setSortOrder(sortOrder != null ? sortOrder : 0);
        filter.setUseYn(Boolean.TRUE.equals(useYn));
        filter.setColorHex(normalizeNullableText(colorHex));
        filter.setIconImageUrl(normalizeNullableText(iconImageUrl));
        filter.setDescription(normalizeNullableText(description));
    }

    private void validateDuplicateCode(Long filterId, String rawCode) {
        String normalizedCode = normalizeCode(rawCode);
        filterRepository.findByCode(normalizedCode).ifPresent(found -> {
            if (filterId == null || !found.getId().equals(filterId)) {
                throw new IllegalArgumentException("이미 사용 중인 필터 코드입니다.");
            }
        });
    }

    private void validateDuplicateName(Long filterId, Long filterGroupId, String rawName) {
        String normalizedName = normalizeName(rawName);
        boolean duplicated = filterRepository.findByFilterGroupIdOrderBySortOrderAscIdAsc(filterGroupId).stream()
                .anyMatch(filter ->
                        filter.getName().equalsIgnoreCase(normalizedName)
                                && (filterId == null || !filter.getId().equals(filterId))
                );

        if (duplicated) {
            throw new IllegalArgumentException("같은 그룹 안에 이미 사용 중인 필터명입니다.");
        }
    }

    private boolean matchesFilterGroupId(Filter filter, Long filterGroupId) {
        return filterGroupId == null
                || (filter.getFilterGroup() != null && filter.getFilterGroup().getId().equals(filterGroupId));
    }

    private boolean matchesKeyword(Filter filter, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        String normalizedKeyword = keyword.trim().toLowerCase();
        return filter.getName().toLowerCase().contains(normalizedKeyword)
                || filter.getCode().toLowerCase().contains(normalizedKeyword)
                || (filter.getFilterGroup() != null
                && filter.getFilterGroup().getName().toLowerCase().contains(normalizedKeyword));
    }

    private boolean matchesUseYn(Filter filter, Boolean useYn) {
        return useYn == null || filter.isUseYn() == useYn;
    }

    private AdminFilterDtos.FilterListResponse toListResponse(Filter filter) {
        return new AdminFilterDtos.FilterListResponse(
                filter.getId(),
                filter.getFilterGroup() != null ? filter.getFilterGroup().getId() : null,
                filter.getFilterGroup() != null ? filter.getFilterGroup().getName() : null,
                filter.getName(),
                filter.getCode(),
                filter.getSortOrder(),
                filter.isUseYn(),
                filter.getColorHex(),
                filter.getIconImageUrl(),
                filter.getDescription(),
                ApiDateTimeConverter.toUtcString(filter.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(filter.getUpdatedAt())
        );
    }

    private AdminFilterDtos.FilterDetailResponse toDetailResponse(Filter filter) {
        return new AdminFilterDtos.FilterDetailResponse(
                filter.getId(),
                filter.getFilterGroup() != null ? filter.getFilterGroup().getId() : null,
                filter.getFilterGroup() != null ? filter.getFilterGroup().getName() : null,
                filter.getName(),
                filter.getCode(),
                filter.getSortOrder(),
                filter.isUseYn(),
                filter.getColorHex(),
                filter.getIconImageUrl(),
                filter.getDescription(),
                ApiDateTimeConverter.toUtcString(filter.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(filter.getUpdatedAt())
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
}
