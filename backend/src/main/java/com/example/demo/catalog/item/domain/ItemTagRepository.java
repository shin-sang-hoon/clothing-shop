package com.example.demo.catalog.item.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemTagRepository extends JpaRepository<ItemTag, Long> {

    interface TagUsageCount {
        Long getTagId();
        Long getItemCount();
    }

    void deleteByItemId(Long itemId);

    void deleteByTagId(Long tagId);

    @Query("SELECT it.item.id FROM ItemTag it WHERE it.tag.name = :tagName AND it.item.retailPrice < :maxPrice")
    List<Long> findItemIdsByTagNameAndPriceLessThan(@Param("tagName") String tagName, @Param("maxPrice") int maxPrice);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM ItemTag it WHERE it.tag.name = :tagName AND it.item.retailPrice < :maxPrice")
    int deleteByTagNameAndItemPriceLessThan(@Param("tagName") String tagName, @Param("maxPrice") int maxPrice);

    boolean existsByItemIdAndTagId(Long itemId, Long tagId);

    @Query("""
            SELECT it.tag.id AS tagId, COUNT(DISTINCT it.item.id) AS itemCount
            FROM ItemTag it
            WHERE it.item.category.id = :categoryId
              AND it.item.useYn = true
            GROUP BY it.tag.id
            """)
    List<TagUsageCount> countDistinctItemsByCategoryId(@Param("categoryId") Long categoryId);

    @Query("""
            SELECT it.tag.id AS tagId, COUNT(DISTINCT it.item.id) AS itemCount
            FROM ItemTag it
            WHERE it.item.brand.id = :brandId
              AND it.item.useYn = true
            GROUP BY it.tag.id
            """)
    List<TagUsageCount> countDistinctItemsByBrandId(@Param("brandId") Long brandId);

    @Query("SELECT it FROM ItemTag it JOIN FETCH it.tag WHERE it.item.id IN :itemIds")
    List<ItemTag> findByItemIdInWithTag(@Param("itemIds") List<Long> itemIds);

    @Query("SELECT it FROM ItemTag it JOIN FETCH it.tag WHERE it.item.id = :itemId")
    List<ItemTag> findByItemIdWithTag(@Param("itemId") Long itemId);
}
