package com.example.demo.catalog.category.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * CategoryTagGroupMapRepository
 */
public interface CategoryTagGroupMapRepository extends JpaRepository<CategoryTagGroupMap, Long> {

    /**
     * 특정 카테고리에 연결된 태그그룹 매핑 목록 조회 (태그그룹 eager fetch)
     */
    @Query("SELECT m FROM CategoryTagGroupMap m JOIN FETCH m.tagGroup WHERE m.category.id = :categoryId ORDER BY m.sortOrder ASC, m.id ASC")
    List<CategoryTagGroupMap> findByCategoryIdWithTagGroup(@Param("categoryId") Long categoryId);

    /**
     * 카테고리 ID + 태그그룹 ID 기준 존재 여부 확인
     */
    boolean existsByCategoryIdAndTagGroupId(Long categoryId, Long tagGroupId);

    /**
     * 카테고리의 매핑 전체 삭제 (재설정 시 사용)
     */
    @Modifying
    @Query("DELETE FROM CategoryTagGroupMap m WHERE m.category.id = :categoryId")
    void deleteByCategoryId(@Param("categoryId") Long categoryId);

    /**
     * 태그그룹의 매핑 전체 삭제 (태그그룹 삭제 시 사용)
     */
    @Modifying
    @Query("DELETE FROM CategoryTagGroupMap m WHERE m.tagGroup.id = :tagGroupId")
    void deleteByTagGroupId(@Param("tagGroupId") Long tagGroupId);
}
