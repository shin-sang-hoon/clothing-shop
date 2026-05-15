package com.example.demo.catalog.brand.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BrandTagMapRepository extends JpaRepository<BrandTagMap, Long> {

    List<BrandTagMap> findByBrandIdOrderByItemCountDescIdAsc(Long brandId);

    @Modifying
    @Query("DELETE FROM BrandTagMap btm WHERE btm.brand.id = :brandId")
    void deleteByBrandId(@Param("brandId") Long brandId);

    @Modifying
    @Query("DELETE FROM BrandTagMap btm WHERE btm.tag.filterGroup.id = :filterGroupId")
    void deleteByTagFilterGroupId(@Param("filterGroupId") Long filterGroupId);

    @Modifying
    @Query("DELETE FROM BrandTagMap btm WHERE btm.brand.id IN :brandIds")
    void deleteByBrandIdIn(@Param("brandIds") List<Long> brandIds);
}
