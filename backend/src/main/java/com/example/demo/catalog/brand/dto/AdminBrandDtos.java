package com.example.demo.catalog.brand.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * AdminBrandDtos
 * - 관리자 브랜드 관리 DTO 모음
 */
public class AdminBrandDtos {

    /**
     * BrandListResponse
     * - 브랜드 목록 1행 응답
     */
    public record BrandListResponse(
            Long id,
            String code,
            String nameKo,
            String nameEn,
            String iconImageUrl,
            boolean exclusiveYn,
            Integer sortOrder,
            boolean useYn,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    /**
     * BrandDetailResponse
     * - 브랜드 상세 응답
     */
    public record BrandDetailResponse(
            Long id,
            String code,
            String nameKo,
            String nameEn,
            String iconImageUrl,
            boolean exclusiveYn,
            Integer sortOrder,
            boolean useYn,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    /**
     * CreateBrandRequest
     * - 브랜드 등록 요청
     */
    public record CreateBrandRequest(
            @NotBlank(message = "브랜드 코드를 입력해주세요.")
            @Size(max = 50, message = "브랜드 코드는 50자 이하로 입력해주세요.")
            String code,

            @NotBlank(message = "브랜드 국문명을 입력해주세요.")
            @Size(max = 100, message = "브랜드 국문명은 100자 이하로 입력해주세요.")
            String nameKo,

            @NotBlank(message = "브랜드 영문명을 입력해주세요.")
            @Size(max = 100, message = "브랜드 영문명은 100자 이하로 입력해주세요.")
            String nameEn,

            @Size(max = 500, message = "아이콘 이미지 URL은 500자 이하로 입력해주세요.")
            String iconImageUrl,

            @NotNull(message = "단독 여부를 선택해주세요.")
            Boolean exclusiveYn,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    /**
     * UpdateBrandRequest
     * - 브랜드 수정 요청
     */
    public record UpdateBrandRequest(
            @NotBlank(message = "브랜드 코드를 입력해주세요.")
            @Size(max = 50, message = "브랜드 코드는 50자 이하로 입력해주세요.")
            String code,

            @NotBlank(message = "브랜드 국문명을 입력해주세요.")
            @Size(max = 100, message = "브랜드 국문명은 100자 이하로 입력해주세요.")
            String nameKo,

            @NotBlank(message = "브랜드 영문명을 입력해주세요.")
            @Size(max = 100, message = "브랜드 영문명은 100자 이하로 입력해주세요.")
            String nameEn,

            @Size(max = 500, message = "아이콘 이미지 URL은 500자 이하로 입력해주세요.")
            String iconImageUrl,

            @NotNull(message = "단독 여부를 선택해주세요.")
            Boolean exclusiveYn,

            @NotNull(message = "정렬순서를 입력해주세요.")
            Integer sortOrder,

            @NotNull(message = "사용 여부를 선택해주세요.")
            Boolean useYn,

            @Size(max = 500, message = "설명은 500자 이하로 입력해주세요.")
            String description
    ) {
    }

    /**
     * UpdateBrandUseRequest
     * - 사용 여부 변경 요청
     */
    public record UpdateBrandUseRequest(
            @NotNull(message = "사용 여부를 입력해주세요.")
            Boolean useYn
    ) {
    }
}