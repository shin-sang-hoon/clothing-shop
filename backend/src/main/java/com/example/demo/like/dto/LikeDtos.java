package com.example.demo.like.dto;

/**
 * LikeDtos
 * - 좋아요 관련 요청/응답 DTO
 */
public class LikeDtos {

    /**
     * 좋아요 토글 응답
     */
    public record LikeToggleResponse(
            boolean liked,
            int likeCnt
    ) {
    }

    /**
     * 좋아요한 아이템 응답
     * - item_like 테이블 기준으로 반환 (item DB 직접 조회 X)
     */
    public record LikedItemResponse(
            Long itemId,
            String itemNo,
            String name,
            String brandName,
            String kind,
            Integer rentalPrice,
            Integer retailPrice,
            int likeCnt,
            String img,
            String createdAt
    ) {
    }

    /**
     * 좋아요한 브랜드 응답
     */
    public record LikedBrandResponse(
            Long brandId,
            String nameKo,
            String nameEn,
            String iconImageUrl,
            String createdAt
    ) {
    }
}
