package com.example.demo.catalog.filter.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FilterRepository extends JpaRepository<Filter, Long> {

    boolean existsByCode(String code);

    boolean existsByName(String name);

    List<Filter> findByNameIn(List<String> names);

    Optional<Filter> findFirstByNameIgnoreCase(String name);

    List<Filter> findByFilterGroupIdAndUseYnTrueOrderBySortOrderAscIdAsc(Long filterGroupId);

    List<Filter> findByFilterGroupIdOrderBySortOrderAscIdAsc(Long filterGroupId);

    List<Filter> findByUseYnTrueOrderBySortOrderAscIdAsc();

    Optional<Filter> findByCode(String code);

    @Query("""
            SELECT f
            FROM Filter f
            JOIN f.filterGroup fg
            WHERE LOWER(fg.name) = LOWER(:groupName)
              AND LOWER(f.name) = LOWER(:filterName)
            ORDER BY f.id ASC
            """)
    List<Filter> findByFilterGroupNameAndFilterNameLower(
            @Param("groupName") String groupName,
            @Param("filterName") String filterName
    );

    @Modifying
    @Query("DELETE FROM Filter f WHERE f.filterGroup.id = :filterGroupId")
    void deleteByFilterGroupId(@Param("filterGroupId") Long filterGroupId);
}
