package com.example.demo.catalog.filter.dto;

import com.example.demo.catalog.filter.domain.FilterGroupRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AdminFilterGroupDtos {

    public record FilterSummary(
            Long id,
            String name,
            String code,
            String colorHex,
            String iconImageUrl
    ) {
    }

    public record FilterGroupListResponse(
            Long id,
            String name,
            String code,
            boolean multiSelectYn,
            FilterGroupRole role,
            Integer sortOrder,
            boolean useYn,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record FilterGroupDetailResponse(
            Long id,
            String name,
            String code,
            boolean multiSelectYn,
            FilterGroupRole role,
            Integer sortOrder,
            boolean useYn,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record FilterGroupWithFiltersResponse(
            Long id,
            String name,
            String code,
            boolean multiSelectYn,
            FilterGroupRole role,
            Integer sortOrder,
            boolean useYn,
            List<FilterSummary> filters
    ) {
    }

    public record CreateFilterGroupRequest(
            @NotBlank(message = "그룹명을 입력해주세요.")
            @Size(max = 100, message = "그룹명은 100자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "그룹 코드를 입력해주세요.")
            @Size(max = 50, message = "그룹 코드는 50자 이하로 입력해주세요.")
            String code,

            @NotNull(message = "선택 방식을 선택해주세요.")
            Boolean multiSelectYn,

            @NotNull(message = "역할을 선택해주세요.")
            FilterGroupRole role,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    public record UpdateFilterGroupRequest(
            @NotBlank(message = "그룹명을 입력해주세요.")
            @Size(max = 100, message = "그룹명은 100자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "그룹 코드를 입력해주세요.")
            @Size(max = 50, message = "그룹 코드는 50자 이하로 입력해주세요.")
            String code,

            @NotNull(message = "선택 방식을 선택해주세요.")
            Boolean multiSelectYn,

            @NotNull(message = "역할을 선택해주세요.")
            FilterGroupRole role,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    public record UpdateFilterGroupUseRequest(
            @NotNull(message = "사용 여부를 입력해주세요.")
            Boolean useYn
    ) {
    }
}
