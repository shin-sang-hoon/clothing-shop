package com.example.demo.trade.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemOptionRepository extends JpaRepository<ItemOption, Long> {

    interface TagUsageCount {
        Long getTagId();

        Long getItemCount();
    }

    /**
     * 상품 옵션 목록 정렬 조회
     * - sortOrder 오름차순
     * - 동일 sortOrder 내에서는 id 오름차순
     */
    List<ItemOption> findByItemIdOrderBySortOrderAscIdAsc(Long itemId);

    /**
     * 상품 옵션 목록 기본 조회
     * - 정렬 조건 없이 itemId 기준으로만 조회
     * - 다른 로직에서 단순 조회가 필요할 때 사용
     */
    List<ItemOption> findByItemId(Long itemId);

    /**
     * 상품 ID 목록 기준 옵션 일괄 조회 (관리자 목록용)
     */
    @Query("SELECT io FROM ItemOption io WHERE io.item.id IN :itemIds ORDER BY io.sortOrder ASC, io.id ASC")
    List<ItemOption> findByItemIdIn(@Param("itemIds") List<Long> itemIds);

    /**
     * 상품 ID 기준 옵션 전체 삭제
     */
    @Modifying
    @Query("DELETE FROM ItemOption io WHERE io.item.id = :itemId")
    void deleteByItemId(@Param("itemId") Long itemId);

    /**
     * 특정 필터그룹에 속한 filter를 참조하는 item_option의 source_tag를 null로 초기화
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE ItemOption io SET io.sourceTag = null WHERE io.sourceTag IS NOT NULL AND io.sourceTag.filterGroup.id = :filterGroupId")
    void nullifySourceTagByFilterGroupId(@Param("filterGroupId") Long filterGroupId);

    /**
     * 카테고리별 태그 사용 상품 수 집계
     * - sourceTag 가 연결된 옵션만 대상
     * - 사용 중인 상품만 집계
     */
    @Query("""
            SELECT io.sourceTag.id AS tagId, COUNT(DISTINCT io.item.id) AS itemCount
            FROM ItemOption io
            WHERE io.item.category.id = :categoryId
              AND io.item.useYn = true
              AND io.sourceTag IS NOT NULL
            GROUP BY io.sourceTag.id
            """)
    List<TagUsageCount> countDistinctItemsByCategoryId(@Param("categoryId") Long categoryId);

    /**
     * 브랜드별 태그 사용 상품 수 집계
     * - sourceTag 가 연결된 옵션만 대상
     * - 사용 중인 상품만 집계
     */
    @Query("""
            SELECT io.sourceTag.id AS tagId, COUNT(DISTINCT io.item.id) AS itemCount
            FROM ItemOption io
            WHERE io.item.brand.id = :brandId
              AND io.item.useYn = true
              AND io.sourceTag IS NOT NULL
            GROUP BY io.sourceTag.id
            """)
    List<TagUsageCount> countDistinctItemsByBrandId(@Param("brandId") Long brandId);
}