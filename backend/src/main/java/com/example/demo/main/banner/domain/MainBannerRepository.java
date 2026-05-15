package com.example.demo.main.banner.domain;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MainBannerRepository extends JpaRepository<MainBanner, Long> {

    Optional<MainBanner> findByCode(String code);

    List<MainBanner> findByUseYnTrueOrderBySortOrderAscIdAsc();

    default List<MainBanner> findAllForAdmin() {
        return findAll(Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id")));
    }
}
