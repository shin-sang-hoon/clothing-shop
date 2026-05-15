package com.example.demo.catalog.filter.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FilterGroupRepository extends JpaRepository<FilterGroup, Long> {

    boolean existsByCode(String code);

    boolean existsByName(String name);

    List<FilterGroup> findByUseYnTrueOrderBySortOrderAscIdAsc();

    Optional<FilterGroup> findByCode(String code);

    Optional<FilterGroup> findByName(String name);

    /**
     * item_option에서 실제 사용 중인 필터 그룹의 role을 ATTRIBUTE → ALL로 변경
     * (기존 상품 옵션 데이터와 role 충돌 해소용 마이그레이션)
     */
    @Modifying
    @Query(value = """
            UPDATE filter_group
            SET group_role = 'ALL'
            WHERE group_role = 'ATTRIBUTE'
              AND id IN (
                SELECT DISTINCT f.filter_group_id
                FROM filter f
                INNER JOIN item_option io ON io.source_tag_id = f.id
              )
            """, nativeQuery = true)
    int fixAttributeGroupsUsedAsOptions();
}
