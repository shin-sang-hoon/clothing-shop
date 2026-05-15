package com.example.demo.catalog.tag.application;

import com.example.demo.catalog.item.domain.ItemTagRepository;
import com.example.demo.catalog.tag.domain.Tag;
import com.example.demo.catalog.tag.domain.TagRepository;
import com.example.demo.catalog.tag.dto.AdminTagDtos;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.global.util.AdminPageSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final ItemTagRepository itemTagRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminTagDtos.TagListResponse> getTags(
            int page,
            int size,
            String keyword,
            Boolean useYn
    ) {
        Pageable pageable = AdminPageSupport.createPageable(page, size, 10);

        List<AdminTagDtos.TagListResponse> filteredContent = tagRepository.findAllOrderBySortOrderAscIdAsc().stream()
                .filter(tag -> matchesKeyword(tag, keyword))
                .filter(tag -> matchesUseYn(tag, useYn))
                .map(this::toListResponse)
                .toList();

        return AdminPageSupport.toPageResponse(filteredContent, pageable);
    }

    @Transactional(readOnly = true)
    public AdminTagDtos.TagDetailResponse getTag(Long tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다. id=" + tagId));
        return toDetailResponse(tag);
    }

    @Transactional
    public AdminTagDtos.TagDetailResponse createTag(AdminTagDtos.CreateTagRequest req) {
        validateDuplicateCode(null, req.code());
        validateDuplicateName(null, req.name());

        Tag tag = new Tag();
        applyFields(tag, req.name(), req.code(), req.sortOrder(), req.useYn(), req.description());
        return toDetailResponse(tagRepository.save(tag));
    }

    @Transactional
    public AdminTagDtos.TagDetailResponse updateTag(Long tagId, AdminTagDtos.UpdateTagRequest req) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다. id=" + tagId));

        validateDuplicateCode(tagId, req.code());
        validateDuplicateName(tagId, req.name());

        applyFields(tag, req.name(), req.code(), req.sortOrder(), req.useYn(), req.description());
        return toDetailResponse(tag);
    }

    @Transactional
    public AdminTagDtos.TagDetailResponse updateUseYn(Long tagId, AdminTagDtos.UpdateTagUseRequest req) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다. id=" + tagId));
        tag.setUseYn(Boolean.TRUE.equals(req.useYn()));
        return toDetailResponse(tag);
    }

    @Transactional
    public void deleteTag(Long tagId) {
        if (!tagRepository.existsById(tagId)) {
            throw new IllegalArgumentException("태그를 찾을 수 없습니다. id=" + tagId);
        }

        itemTagRepository.deleteByTagId(tagId);
        tagRepository.deleteById(tagId);
    }

    private void applyFields(Tag tag, String name, String code, Integer sortOrder, Boolean useYn, String description) {
        tag.setName(normalizeName(name));
        tag.setCode(normalizeCode(code));
        tag.setSortOrder(sortOrder != null ? sortOrder : 0);
        tag.setUseYn(Boolean.TRUE.equals(useYn));
        tag.setDescription(normalizeNullableText(description));
    }

    private void validateDuplicateCode(Long tagId, String rawCode) {
        String normalizedCode = normalizeCode(rawCode);
        tagRepository.findByCode(normalizedCode).ifPresent(found -> {
            if (tagId == null || !found.getId().equals(tagId)) {
                throw new IllegalArgumentException("이미 사용 중인 태그 코드입니다.");
            }
        });
    }

    private void validateDuplicateName(Long tagId, String rawName) {
        String normalizedName = normalizeName(rawName);
        tagRepository.findFirstByNameIgnoreCase(normalizedName).ifPresent(found -> {
            if (tagId == null || !found.getId().equals(tagId)) {
                throw new IllegalArgumentException("이미 사용 중인 태그명입니다.");
            }
        });
    }

    private boolean matchesKeyword(Tag tag, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        String normalizedKeyword = keyword.trim().toLowerCase();
        return tag.getName().toLowerCase().contains(normalizedKeyword)
                || tag.getCode().toLowerCase().contains(normalizedKeyword)
                || (tag.getDescription() != null && tag.getDescription().toLowerCase().contains(normalizedKeyword));
    }

    private boolean matchesUseYn(Tag tag, Boolean useYn) {
        return useYn == null || tag.isUseYn() == useYn;
    }

    private AdminTagDtos.TagListResponse toListResponse(Tag tag) {
        return new AdminTagDtos.TagListResponse(
                tag.getId(),
                tag.getName(),
                tag.getCode(),
                tag.getSortOrder(),
                tag.isUseYn(),
                tag.getDescription(),
                ApiDateTimeConverter.toUtcString(tag.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(tag.getUpdatedAt())
        );
    }

    private AdminTagDtos.TagDetailResponse toDetailResponse(Tag tag) {
        return new AdminTagDtos.TagDetailResponse(
                tag.getId(),
                tag.getName(),
                tag.getCode(),
                tag.getSortOrder(),
                tag.isUseYn(),
                tag.getDescription(),
                ApiDateTimeConverter.toUtcString(tag.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(tag.getUpdatedAt())
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
