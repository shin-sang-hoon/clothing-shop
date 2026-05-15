package com.example.demo.catalog.brand.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * BrandRepository
 * - 브랜드 기본 조회/중복 체크용 Repository
 */
public interface BrandRepository extends JpaRepository<Brand, Long> {

    /**
     * 브랜드 코드 중복 체크
     */
    boolean existsByCode(String code);

    /**
     * 국문명 중복 체크
     */
    boolean existsByNameKo(String nameKo);

    /**
     * 영문명 중복 체크
     */
    boolean existsByNameEn(String nameEn);

    /**
     * 사용 중인 브랜드 목록 조회 (List - 초성 필터용)
     */
    List<Brand> findByUseYnTrueOrderBySortOrderAscIdAsc();

    /**
     * 사용 중인 브랜드 페이지 조회 (초기 로드 / 정렬 포함)
     */
    Page<Brand> findByUseYnTrue(Pageable pageable);

    /**
     * 키워드로 브랜드 검색 (DB 레벨 LIKE, 대소문자 무시)
     * - 국문명 또는 영문명에 keyword 포함 시 반환
     */
    @Query("SELECT b FROM Brand b WHERE b.useYn = true " +
           "AND (LOWER(b.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(b.nameEn) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Brand> findByUseYnTrueAndKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 단독 브랜드 + 사용 여부 기준 조회
     */
    List<Brand> findByExclusiveYnAndUseYnTrueOrderBySortOrderAscIdAsc(boolean exclusiveYn);

    /**
     * 코드 기준 단건 조회
     */
    Optional<Brand> findByCode(String code);

    Optional<Brand> findByNameKoIgnoreCase(String nameKo);

    Optional<Brand> findByNameEnIgnoreCase(String nameEn);

    @Query("SELECT b FROM Brand b WHERE LOWER(b.nameKo) = LOWER(:name)")
    List<Brand> findByNameKoLower(@Param("name") String name);

    @Query("SELECT b FROM Brand b WHERE LOWER(b.nameEn) = LOWER(:name)")
    List<Brand> findByNameEnLower(@Param("name") String name);

    /**
     * 상품이 하나도 없는 브랜드 조회
     */
    @Query("SELECT b FROM Brand b WHERE NOT EXISTS (SELECT 1 FROM Item i WHERE i.brand = b)")
    List<Brand> findBrandsWithNoItems();
}
