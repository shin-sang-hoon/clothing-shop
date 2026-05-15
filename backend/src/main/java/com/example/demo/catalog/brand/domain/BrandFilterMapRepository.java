package com.example.demo.catalog.brand.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BrandFilterMapRepository extends JpaRepository<BrandFilterMap, Long> {

    List<BrandFilterMap> findByBrandIdOrderBySortOrderAscIdAsc(Long brandId);

    @Modifying
    @Query("DELETE FROM BrandFilterMap m WHERE m.brand.id = :brandId")
    void deleteByBrandId(@Param("brandId") Long brandId);

    @Modifying
    @Query("DELETE FROM BrandFilterMap m WHERE m.filter.filterGroup.id = :filterGroupId")
    void deleteByFilterFilterGroupId(@Param("filterGroupId") Long filterGroupId);

    @Modifying
    @Query("DELETE FROM BrandFilterMap m WHERE m.brand.id IN :brandIds")
    void deleteByBrandIdIn(@Param("brandIds") List<Long> brandIds);
}
