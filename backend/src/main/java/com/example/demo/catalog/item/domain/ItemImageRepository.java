package com.example.demo.catalog.item.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * ItemImageRepository
 */
public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {

    /**
     * 상품의 전체 이미지 (정렬 순 조회)
     */
    List<ItemImage> findByItemIdOrderByImageTypeAscSortOrderAsc(Long itemId);

    /**
     * 상품의 대표이미지 단건
     */
    Optional<ItemImage> findByItemIdAndImageType(Long itemId, ItemImageType imageType);

    /**
     * 상품의 서브이미지 목록
     */
    List<ItemImage> findByItemIdAndImageTypeOrderBySortOrderAsc(Long itemId, ItemImageType imageType);

    /**
     * 다건 상품 + 이미지 타입으로 이미지 목록 조회
     */
    List<ItemImage> findByItemIdInAndImageTypeOrderByItemIdAscSortOrderAsc(
            List<Long> itemIds,
            ItemImageType imageType
    );

    /**
     * 상품 이미지 전체 삭제 (상품 수정 시 교체용)
     */
    void deleteByItemId(Long itemId);

    void deleteByItemIdAndImageType(Long itemId, ItemImageType imageType);
}
