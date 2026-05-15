package com.example.demo.catalog.item.dto;

import java.util.List;

/**
 * ItemDtos
 * - 사용자 노출용 상품 응답 DTO 모음
 */
public class ItemDtos {

    /**
     * ItemTag
     * - 태그 간략 응답
     */
    public record ItemTag(
            Long id,
            String name,
            String code,
            String colorHex
    ) {
    }

    /**
     * ItemListResponse
     * - 상품 목록 카드 1개 응답
     */
    public record ItemListResponse(
            Long id,
            String itemNo,
            String name,
            Long brandId,
            String brandCode,
            String brand,
            Long categoryId,
            String categoryCode,
            String category,
            String kind,
            Integer retailPrice,
            Integer rentalPrice,
            String itemMode,
            Integer likeCnt,
            Integer viewCnt,
            String status,
            String img,
            List<String> subImgs
    ) {
    }

    /**
     * ItemDetailResponse
     * - 사용자 상품 상세 응답
     * - 메인이미지 + 서브이미지 + 태그그룹별 태그 + 상품 상세(HTML) 포함
     */
    public record ItemDetailResponse(
            Long id,
            String itemNo,
            String name,
            Long brandId,
            String brand,
            String brandIconImageUrl,
            String category,
            String kind,
            Integer retailPrice,
            Integer rentalPrice,
            String itemMode,
            Integer likeCnt,
            Integer viewCnt,
            String status,
            String img,
            List<String> subImgs,
            List<TagGroupSummary> tagGroups,
            /**
             * 리치 텍스트 에디터로 작성된 HTML
             * - 상품 상세 영역에 innerHTML 로 삽입
             */
            String description
    ) {
    }

    /**
     * TagGroupSummary
     * - 태그그룹별 묶음 응답 (상품 상세 태그 섹션용)
     */
    public record TagGroupSummary(
            Long groupId,
            String groupName,
            String groupCode,
            List<ItemTag> tags
    ) {
    }
}
