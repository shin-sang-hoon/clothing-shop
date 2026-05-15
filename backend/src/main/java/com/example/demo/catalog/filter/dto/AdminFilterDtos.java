package com.example.demo.catalog.filter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AdminFilterDtos {

    public record FilterListResponse(
            Long id,
            Long filterGroupId,
            String filterGroupName,
            String name,
            String code,
            Integer sortOrder,
            boolean useYn,
            String colorHex,
            String iconImageUrl,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record FilterDetailResponse(
            Long id,
            Long filterGroupId,
            String filterGroupName,
            String name,
            String code,
            Integer sortOrder,
            boolean useYn,
            String colorHex,
            String iconImageUrl,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record CreateFilterRequest(
            @NotNull(message = "필터 그룹을 선택해주세요.")
            Long filterGroupId,

            @NotBlank(message = "필터명을 입력해주세요.")
            @Size(max = 100, message = "필터명은 100자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "필터 코드를 입력해주세요.")
            @Size(max = 100, message = "필터 코드는 100자 이하로 입력해주세요.")
            String code,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 20, message = "색상 HEX는 20자 이하로 입력해주세요.")
            String colorHex,

            @Size(max = 500, message = "아이콘 이미지 URL은 500자 이하로 입력해주세요.")
            String iconImageUrl,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    public record UpdateFilterRequest(
            @NotNull(message = "필터 그룹을 선택해주세요.")
            Long filterGroupId,

            @NotBlank(message = "필터명을 입력해주세요.")
            @Size(max = 100, message = "필터명은 100자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "필터 코드를 입력해주세요.")
            @Size(max = 100, message = "필터 코드는 100자 이하로 입력해주세요.")
            String code,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 20, message = "색상 HEX는 20자 이하로 입력해주세요.")
            String colorHex,

            @Size(max = 500, message = "아이콘 이미지 URL은 500자 이하로 입력해주세요.")
            String iconImageUrl,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    public record UpdateFilterUseRequest(
            @NotNull(message = "사용 여부를 입력해주세요.")
            Boolean useYn
    ) {
    }
}
