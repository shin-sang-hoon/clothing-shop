package com.example.demo.catalog.category.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * CategoryRepository
 * - 카테고리 기본 조회/중복 체크용 Repository
 */
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * 코드 중복 체크
     */
    boolean existsByCode(String code);

    /**
     * 코드로 단건 조회
     */
    Optional<Category> findByCode(String code);

    Optional<Category> findByDepthAndNameIgnoreCase(Integer depth, String name);

    List<Category> findAllByDepthAndNameIgnoreCase(Integer depth, String name);

    /**
     * 최상위 카테고리 중 같은 이름 조회
     * - parent 가 null 인 루트 카테고리에서만 검사
     */
    Optional<Category> findByParentIsNullAndNameIgnoreCase(String name);

    /**
     * 같은 부모 아래 같은 이름 조회
     */
    Optional<Category> findByParentIdAndNameIgnoreCase(Long parentId, String name);

    /**
     * 전체 카테고리를 parent JOIN FETCH — N+1 방지용 공개 API 전용
     */
    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.parent ORDER BY c.depth ASC, c.sortOrder ASC, c.id ASC")
    List<Category> findAllWithParent();

    /**
     * 사용 중인 카테고리만 정렬순서 기준으로 조회
     */
    List<Category> findByUseYnTrueOrderBySortOrderAscIdAsc();

    /**
     * 특정 부모 카테고리 하위 목록 조회
     */
    List<Category> findByParentIdAndUseYnTrueOrderBySortOrderAscIdAsc(Long parentId);
}
