package com.example.demo.catalog.item.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemFilterRepository extends JpaRepository<ItemFilter, Long> {

    interface TagUsageCount {
        Long getTagId();
        Long getItemCount();
    }

    @Query("SELECT it FROM ItemFilter it JOIN FETCH it.tag t JOIN FETCH t.filterGroup WHERE it.item.id = :itemId")
    List<ItemFilter> findByItemIdWithTag(@Param("itemId") Long itemId);

    @Modifying
    @Query("DELETE FROM ItemFilter it WHERE it.item.id = :itemId")
    void deleteByItemId(@Param("itemId") Long itemId);

    @Query("SELECT it FROM ItemFilter it JOIN FETCH it.tag t JOIN FETCH t.filterGroup WHERE it.item.id IN :itemIds")
    List<ItemFilter> findByItemIdInWithTag(@Param("itemIds") List<Long> itemIds);

    @Query("""
            SELECT it.tag.id AS tagId, COUNT(DISTINCT it.item.id) AS itemCount
            FROM ItemFilter it
            WHERE it.item.category.id = :categoryId
              AND it.item.useYn = true
            GROUP BY it.tag.id
            """)
    List<TagUsageCount> countDistinctItemsByCategoryId(@Param("categoryId") Long categoryId);

    @Query("""
            SELECT it.tag.id AS tagId, COUNT(DISTINCT it.item.id) AS itemCount
            FROM ItemFilter it
            WHERE it.item.brand.id = :brandId
              AND it.item.useYn = true
            GROUP BY it.tag.id
            """)
    List<TagUsageCount> countDistinctItemsByBrandId(@Param("brandId") Long brandId);

    @Modifying
    @Query("DELETE FROM ItemFilter it WHERE it.tag.id = :tagId")
    void deleteByTagId(@Param("tagId") Long tagId);

    @Modifying
    @Query("DELETE FROM ItemFilter it WHERE it.tag.filterGroup.id = :filterGroupId")
    void deleteByTagFilterGroupId(@Param("filterGroupId") Long filterGroupId);
}
