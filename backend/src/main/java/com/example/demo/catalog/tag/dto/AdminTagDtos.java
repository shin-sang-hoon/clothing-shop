package com.example.demo.catalog.tag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AdminTagDtos {

    public record TagListResponse(
            Long id,
            String name,
            String code,
            Integer sortOrder,
            boolean useYn,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record TagDetailResponse(
            Long id,
            String name,
            String code,
            Integer sortOrder,
            boolean useYn,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record CreateTagRequest(
            @NotBlank(message = "태그명을 입력해주세요.")
            @Size(max = 100, message = "태그명은 100자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "태그 코드를 입력해주세요.")
            @Size(max = 100, message = "태그 코드는 100자 이하로 입력해주세요.")
            String code,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    public record UpdateTagRequest(
            @NotBlank(message = "태그명을 입력해주세요.")
            @Size(max = 100, message = "태그명은 100자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "태그 코드를 입력해주세요.")
            @Size(max = 100, message = "태그 코드는 100자 이하로 입력해주세요.")
            String code,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    public record UpdateTagUseRequest(
            @NotNull(message = "사용 여부를 입력해주세요.")
            Boolean useYn
    ) {
    }
}
