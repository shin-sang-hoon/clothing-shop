package com.example.demo.catalog.category.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryFilterMapRepository extends JpaRepository<CategoryFilterMap, Long> {

    List<CategoryFilterMap> findByCategoryIdOrderBySortOrderAscIdAsc(Long categoryId);

    List<CategoryFilterMap> findByCategoryIdInOrderBySortOrderAscIdAsc(List<Long> categoryIds);

    @Modifying
    @Query("DELETE FROM CategoryFilterMap m WHERE m.category.id = :categoryId")
    void deleteByCategoryId(@Param("categoryId") Long categoryId);

    @Modifying
    @Query("DELETE FROM CategoryFilterMap m WHERE m.filter.filterGroup.id = :filterGroupId")
    void deleteByFilterFilterGroupId(@Param("filterGroupId") Long filterGroupId);
}
