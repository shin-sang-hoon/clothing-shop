package com.example.demo.catalog.category.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryDisplayTagMapRepository extends JpaRepository<CategoryDisplayTagMap, Long> {

    List<CategoryDisplayTagMap> findByCategoryIdOrderBySortOrderAscIdAsc(Long categoryId);

    List<CategoryDisplayTagMap> findByCategoryIdInOrderBySortOrderAscIdAsc(List<Long> categoryIds);

    void deleteByCategoryId(Long categoryId);
}
