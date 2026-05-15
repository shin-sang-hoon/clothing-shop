package com.example.demo.catalog.category.dto;

import com.example.demo.catalog.filter.domain.FilterGroupRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AdminCategoryDtos {

    public record CategoryListResponse(
            Long id,
            String name,
            String code,
            Integer depth,
            Long parentId,
            String parentName,
            Integer sortOrder,
            boolean useYn,
            String imageUrl,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record CategoryDetailResponse(
            Long id,
            String name,
            String code,
            Integer depth,
            Long parentId,
            String parentName,
            Integer sortOrder,
            boolean useYn,
            String imageUrl,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record CreateCategoryRequest(
            @NotBlank(message = "카테고리명을 입력해주세요.")
            @Size(max = 100, message = "카테고리명은 100자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "카테고리 코드를 입력해주세요.")
            @Size(max = 50, message = "카테고리 코드는 50자 이하로 입력해주세요.")
            String code,

            Long parentId,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 500, message = "이미지 URL은 500자 이하로 입력해주세요.")
            String imageUrl,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    public record UpdateCategoryRequest(
            @NotBlank(message = "카테고리명을 입력해주세요.")
            @Size(max = 100, message = "카테고리명은 100자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "카테고리 코드를 입력해주세요.")
            @Size(max = 50, message = "카테고리 코드는 50자 이하로 입력해주세요.")
            String code,

            Long parentId,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 500, message = "이미지 URL은 500자 이하로 입력해주세요.")
            String imageUrl,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    public record UpdateCategoryUseRequest(
            @NotNull(message = "사용 여부를 입력해주세요.")
            Boolean useYn
    ) {
    }

    public record FilterInGroupResponse(
            Long id,
            String name,
            String code,
            String colorHex,
            String iconImageUrl
    ) {
    }

    public record CategoryFilterGroupResponse(
            Long filterGroupId,
            String filterGroupName,
            String filterGroupCode,
            boolean multiSelectYn,
            FilterGroupRole role,
            List<FilterInGroupResponse> filters
    ) {
    }
}
