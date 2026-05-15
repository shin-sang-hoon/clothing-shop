package com.example.demo.catalog.tag.domain;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findFirstByNameIgnoreCase(String name);

    Optional<Tag> findByCode(String code);

    List<Tag> findByUseYnTrueOrderBySortOrderAscIdAsc();

    boolean existsByCode(String code);

    default List<Tag> findAllOrderBySortOrderAscIdAsc() {
        return findAll(Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id")));
    }
}
