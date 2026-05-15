package com.example.demo.catalog.category.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryTagMapRepository extends JpaRepository<CategoryTagMap, Long> {

    List<CategoryTagMap> findByCategoryIdOrderByItemCountDescIdAsc(Long categoryId);

    @Modifying
    @Query("DELETE FROM CategoryTagMap ctm WHERE ctm.category.id = :categoryId")
    void deleteByCategoryId(@Param("categoryId") Long categoryId);

    @Modifying
    @Query("DELETE FROM CategoryTagMap ctm WHERE ctm.tag.filterGroup.id = :filterGroupId")
    void deleteByTagFilterGroupId(@Param("filterGroupId") Long filterGroupId);
}
