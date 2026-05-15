package com.example.demo.catalog.brand.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BrandDisplayTagMapRepository extends JpaRepository<BrandDisplayTagMap, Long> {

    List<BrandDisplayTagMap> findByBrandIdOrderBySortOrderAscIdAsc(Long brandId);

    void deleteByBrandId(Long brandId);

    void deleteByBrandIdIn(List<Long> brandIds);
}
