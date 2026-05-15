package com.example.demo.catalog.brand.dto;

/**
 * BrandDtos
 * - 사용자(비관리자) 브랜드 조회용 DTO
 */
public class BrandDtos {

    public record BrandListResponse(
            Long id,
            String code,
            String nameKo,
            String nameEn,
            String iconImageUrl,
            boolean exclusiveYn,
            Integer sortOrder,
            Integer likeCnt
    ) {}
}
