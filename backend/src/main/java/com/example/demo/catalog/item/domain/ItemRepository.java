package com.example.demo.catalog.item.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * ItemRepository
 */
public interface ItemRepository extends JpaRepository<Item, Long> {

    /**
     * 상품번호 중복 체크
     */
    boolean existsByItemNo(String itemNo);

    /**
     * 상품번호 단건 조회
     */
    Optional<Item> findByItemNo(String itemNo);

    /**
     * 사용 중인 상품 목록 (사용자 노출용)
     * - brand, category 함께 fetch
     */
    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.brand LEFT JOIN FETCH i.category WHERE i.useYn = true ORDER BY i.sortOrder ASC, i.id DESC")
    List<Item> findAllActiveWithBrandAndCategory();

    @Query(
            value = """
                    SELECT i
                    FROM Item i
                    LEFT JOIN FETCH i.brand
                    LEFT JOIN FETCH i.category
                    WHERE i.useYn = true
                      AND (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:brand IS NULL
                           OR (i.brand IS NOT NULL AND (
                               LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :brand, '%'))
                               OR LOWER(i.brand.code) LIKE LOWER(CONCAT('%', :brand, '%'))
                           )))
                       AND (:brandCode IS NULL
                            OR (i.brand IS NOT NULL AND (
                                LOWER(i.brand.code) = LOWER(:brandCode)
                                OR STR(i.brand.id) = :brandCode
                            )))
                      AND (:hasTagFilter = false
                           OR EXISTS (
                               SELECT 1
                               FROM ItemTag it
                               WHERE it.item.id = i.id
                                 AND it.tag.id IN :tagIds
                           ))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH'))
                    ORDER BY i.sortOrder ASC, i.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(i)
                    FROM Item i
                    WHERE i.useYn = true
                      AND (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:brand IS NULL
                           OR (i.brand IS NOT NULL AND (
                               LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :brand, '%'))
                               OR LOWER(i.brand.code) LIKE LOWER(CONCAT('%', :brand, '%'))
                           )))
                       AND (:brandCode IS NULL
                            OR (i.brand IS NOT NULL AND (
                                LOWER(i.brand.code) = LOWER(:brandCode)
                                OR STR(i.brand.id) = :brandCode
                            )))
                      AND (:hasTagFilter = false
                           OR EXISTS (
                               SELECT 1
                               FROM ItemTag it
                               WHERE it.item.id = i.id
                                 AND it.tag.id IN :tagIds
                           ))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH'))
                    """
    )
    Page<Item> findActivePaged(
            @Param("keyword") String keyword,
            @Param("brand") String brand,
            @Param("brandCode") String brandCode,
            @Param("hasTagFilter") boolean hasTagFilter,
            @Param("tagIds") List<Long> tagIds,
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    /**
     * 전체 상품 목록 (관리자용) - DB 레벨 필터+페이징
     */
    @Query(
            value = """
                    SELECT DISTINCT i FROM Item i
                    LEFT JOIN FETCH i.brand
                    LEFT JOIN FETCH i.category cat
                    WHERE (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%')))
                           OR (i.itemNo IS NOT NULL AND LOWER(i.itemNo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:kind IS NULL OR i.kind = :kind)
                      AND (:status IS NULL OR i.status = :status)
                      AND (:categoryId IS NULL
                           OR (cat IS NOT NULL AND cat.id = :categoryId)
                           OR (cat IS NOT NULL AND cat.parent IS NOT NULL AND cat.parent.id = :categoryId))
                      AND (:tagId IS NULL
                           OR EXISTS (SELECT 1 FROM ItemFilter f WHERE f.item.id = i.id AND f.tag.id = :tagId))
                      AND (:hasFilter = false
                           OR EXISTS (SELECT 1 FROM ItemFilter f2 WHERE f2.item.id = i.id))
                      AND (:hasAttribute = false
                           OR EXISTS (SELECT 1 FROM ItemTag t WHERE t.item.id = i.id))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (i.itemMode = 'BOTH' AND (:itemMode = 'RENTAL' OR :itemMode = 'AUCTION')))
                    ORDER BY i.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(DISTINCT i) FROM Item i
                    LEFT JOIN i.category cat
                    WHERE (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%')))
                           OR (i.itemNo IS NOT NULL AND LOWER(i.itemNo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:kind IS NULL OR i.kind = :kind)
                      AND (:status IS NULL OR i.status = :status)
                      AND (:categoryId IS NULL
                           OR (cat IS NOT NULL AND cat.id = :categoryId)
                           OR (cat IS NOT NULL AND cat.parent IS NOT NULL AND cat.parent.id = :categoryId))
                      AND (:tagId IS NULL
                           OR EXISTS (SELECT 1 FROM ItemFilter f WHERE f.item.id = i.id AND f.tag.id = :tagId))
                      AND (:hasFilter = false
                           OR EXISTS (SELECT 1 FROM ItemFilter f2 WHERE f2.item.id = i.id))
                      AND (:hasAttribute = false
                           OR EXISTS (SELECT 1 FROM ItemTag t WHERE t.item.id = i.id))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (i.itemMode = 'BOTH' AND (:itemMode = 'RENTAL' OR :itemMode = 'AUCTION')))
                    """
    )
    Page<Item> findAdminItemsPaged(
            @Param("keyword") String keyword,
            @Param("kind") String kind,
            @Param("status") String status,
            @Param("categoryId") Long categoryId,
            @Param("tagId") Long tagId,
            @Param("hasFilter") boolean hasFilter,
            @Param("hasAttribute") boolean hasAttribute,
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    /**
     * 전체 상품 목록 (관리자용) - 레거시, 내부 배치용으로만 사용
     */
    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.brand LEFT JOIN FETCH i.category ORDER BY i.sortOrder ASC, i.id DESC")
    List<Item> findAllWithBrandAndCategory();

    /**
     * 상품 단건 조회 (brand, category fetch)
     */
    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.brand LEFT JOIN FETCH i.category WHERE i.id = :id")
    Optional<Item> findByIdWithBrandAndCategory(@Param("id") Long id);

    @Query("SELECT i.itemNo FROM Item i WHERE i.itemNo IN :itemNos")
    List<String> findItemNosIn(@Param("itemNos") List<String> itemNos);

    /**
     * 브랜드 기준 상품 목록
     */
    List<Item> findByBrandIdAndUseYnTrueOrderBySortOrderAscIdDesc(Long brandId);

    /**
     * 카테고리 기준 상품 목록
     */
    List<Item> findByCategoryIdAndUseYnTrueOrderBySortOrderAscIdDesc(Long categoryId);

    long countByCategory_Code(String categoryCode);

    /**
     * 카테고리 코드 기준 상품 목록 (사용자 노출용)
     * - 뎁스1 코드: 해당 카테고리 직속 상품 + 하위 카테고리 상품 모두 반환
     * - 뎁스2 코드: 해당 카테고리 상품만 반환
     */
    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.brand LEFT JOIN FETCH i.category LEFT JOIN i.category.parent cat_parent " +
            "WHERE i.useYn = true " +
            "AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode) " +
            "ORDER BY i.sortOrder ASC, i.id DESC")
    List<Item> findActiveByCategoryCode(@Param("categoryCode") String categoryCode);

    @Query(
            value = """
                    SELECT i
                    FROM Item i
                    LEFT JOIN FETCH i.brand
                    LEFT JOIN FETCH i.category
                    LEFT JOIN i.category.parent cat_parent
                    WHERE i.useYn = true
                      AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
                      AND (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:brand IS NULL
                           OR (i.brand IS NOT NULL AND (
                               LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :brand, '%'))
                               OR LOWER(i.brand.code) LIKE LOWER(CONCAT('%', :brand, '%'))
                           )))
                       AND (:brandCode IS NULL
                            OR (i.brand IS NOT NULL AND (
                                LOWER(i.brand.code) = LOWER(:brandCode)
                                OR STR(i.brand.id) = :brandCode
                            )))
                      AND (:hasTagFilter = false
                           OR EXISTS (
                               SELECT 1
                               FROM ItemTag it
                               WHERE it.item.id = i.id
                                 AND it.tag.id IN :tagIds
                           ))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH'))
                    ORDER BY i.sortOrder ASC, i.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(i)
                    FROM Item i
                    LEFT JOIN i.category.parent cat_parent
                    WHERE i.useYn = true
                      AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
                      AND (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:brand IS NULL
                           OR (i.brand IS NOT NULL AND (
                               LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :brand, '%'))
                               OR LOWER(i.brand.code) LIKE LOWER(CONCAT('%', :brand, '%'))
                           )))
                       AND (:brandCode IS NULL
                            OR (i.brand IS NOT NULL AND (
                                LOWER(i.brand.code) = LOWER(:brandCode)
                                OR STR(i.brand.id) = :brandCode
                            )))
                      AND (:hasTagFilter = false
                           OR EXISTS (
                               SELECT 1
                               FROM ItemTag it
                               WHERE it.item.id = i.id
                                 AND it.tag.id IN :tagIds
                           ))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH'))
                    """
    )
    Page<Item> findActiveByCategoryCodePaged(
            @Param("categoryCode") String categoryCode,
            @Param("keyword") String keyword,
            @Param("brand") String brand,
            @Param("brandCode") String brandCode,
            @Param("hasTagFilter") boolean hasTagFilter,
            @Param("tagIds") List<Long> tagIds,
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    /**
     * 필터 ID 목록에 해당하는 상품 목록 (사용자 노출용)
     * - item_filter 테이블 JOIN으로 DB 레벨 필터링 → 빠른 검색
     */
    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.brand LEFT JOIN FETCH i.category " +
            "WHERE i.useYn = true " +
            "AND i.id IN (SELECT f.item.id FROM ItemFilter f WHERE f.tag.id IN :filterIds) " +
            "ORDER BY i.sortOrder ASC, i.id DESC")
    List<Item> findActiveByFilterIds(@Param("filterIds") List<Long> filterIds);

    @Query(
            value = """
                    SELECT i
                    FROM Item i
                    LEFT JOIN FETCH i.brand
                    LEFT JOIN FETCH i.category
                    WHERE i.useYn = true
                      AND i.id IN (SELECT f.item.id FROM ItemFilter f WHERE f.tag.id IN :filterIds)
                      AND (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:brand IS NULL
                           OR (i.brand IS NOT NULL AND (
                               LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :brand, '%'))
                               OR LOWER(i.brand.code) LIKE LOWER(CONCAT('%', :brand, '%'))
                           )))
                       AND (:brandCode IS NULL
                            OR (i.brand IS NOT NULL AND (
                                LOWER(i.brand.code) = LOWER(:brandCode)
                                OR STR(i.brand.id) = :brandCode
                            )))
                      AND (:hasTagFilter = false
                           OR EXISTS (
                               SELECT 1
                               FROM ItemTag it
                               WHERE it.item.id = i.id
                                 AND it.tag.id IN :tagIds
                           ))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH'))
                    ORDER BY i.sortOrder ASC, i.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(i)
                    FROM Item i
                    WHERE i.useYn = true
                      AND i.id IN (SELECT f.item.id FROM ItemFilter f WHERE f.tag.id IN :filterIds)
                      AND (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:brand IS NULL
                           OR (i.brand IS NOT NULL AND (
                               LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :brand, '%'))
                               OR LOWER(i.brand.code) LIKE LOWER(CONCAT('%', :brand, '%'))
                           )))
                       AND (:brandCode IS NULL
                            OR (i.brand IS NOT NULL AND (
                                LOWER(i.brand.code) = LOWER(:brandCode)
                                OR STR(i.brand.id) = :brandCode
                            )))
                      AND (:hasTagFilter = false
                           OR EXISTS (
                               SELECT 1
                               FROM ItemTag it
                               WHERE it.item.id = i.id
                                 AND it.tag.id IN :tagIds
                           ))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH'))
                    """
    )
    Page<Item> findActiveByFilterIdsPaged(
            @Param("filterIds") List<Long> filterIds,
            @Param("keyword") String keyword,
            @Param("brand") String brand,
            @Param("brandCode") String brandCode,
            @Param("hasTagFilter") boolean hasTagFilter,
            @Param("tagIds") List<Long> tagIds,
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    /**
     * 카테고리 코드 + 필터 ID 목록 복합 조회 (사용자 노출용)
     */
    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.brand LEFT JOIN FETCH i.category LEFT JOIN i.category.parent cat_parent " +
            "WHERE i.useYn = true " +
            "AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode) " +
            "AND i.id IN (SELECT f.item.id FROM ItemFilter f WHERE f.tag.id IN :filterIds) " +
            "ORDER BY i.sortOrder ASC, i.id DESC")
    List<Item> findActiveByCategoryCodeAndFilterIds(@Param("categoryCode") String categoryCode,
                                                    @Param("filterIds") List<Long> filterIds);

    @Query(
            value = """
                    SELECT i
                    FROM Item i
                    LEFT JOIN FETCH i.brand
                    LEFT JOIN FETCH i.category
                    LEFT JOIN i.category.parent cat_parent
                    WHERE i.useYn = true
                      AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
                      AND i.id IN (SELECT f.item.id FROM ItemFilter f WHERE f.tag.id IN :filterIds)
                      AND (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:brand IS NULL
                           OR (i.brand IS NOT NULL AND (
                               LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :brand, '%'))
                               OR LOWER(i.brand.code) LIKE LOWER(CONCAT('%', :brand, '%'))
                           )))
                       AND (:brandCode IS NULL
                            OR (i.brand IS NOT NULL AND (
                                LOWER(i.brand.code) = LOWER(:brandCode)
                                OR STR(i.brand.id) = :brandCode
                            )))
                      AND (:hasTagFilter = false
                           OR EXISTS (
                               SELECT 1
                               FROM ItemTag it
                               WHERE it.item.id = i.id
                                 AND it.tag.id IN :tagIds
                           ))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH'))
                    ORDER BY i.sortOrder ASC, i.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(i)
                    FROM Item i
                    LEFT JOIN i.category.parent cat_parent
                    WHERE i.useYn = true
                      AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
                      AND i.id IN (SELECT f.item.id FROM ItemFilter f WHERE f.tag.id IN :filterIds)
                      AND (:keyword IS NULL
                           OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR (i.brand IS NOT NULL AND LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                      AND (:brand IS NULL
                           OR (i.brand IS NOT NULL AND (
                               LOWER(i.brand.nameKo) LIKE LOWER(CONCAT('%', :brand, '%'))
                               OR LOWER(i.brand.code) LIKE LOWER(CONCAT('%', :brand, '%'))
                           )))
                       AND (:brandCode IS NULL
                            OR (i.brand IS NOT NULL AND (
                                LOWER(i.brand.code) = LOWER(:brandCode)
                                OR STR(i.brand.id) = :brandCode
                            )))
                      AND (:hasTagFilter = false
                           OR EXISTS (
                               SELECT 1
                               FROM ItemTag it
                               WHERE it.item.id = i.id
                                 AND it.tag.id IN :tagIds
                           ))
                      AND (:itemMode IS NULL
                           OR i.itemMode = :itemMode
                           OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH'))
                    """
    )
    Page<Item> findActiveByCategoryCodeAndFilterIdsPaged(
            @Param("categoryCode") String categoryCode,
            @Param("filterIds") List<Long> filterIds,
            @Param("keyword") String keyword,
            @Param("brand") String brand,
            @Param("brandCode") String brandCode,
            @Param("hasTagFilter") boolean hasTagFilter,
            @Param("tagIds") List<Long> tagIds,
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    @Query(
            value = """
                    SELECT i
                    FROM Item i
                    LEFT JOIN FETCH i.brand
                    LEFT JOIN FETCH i.category
                    WHERE i.useYn = true
                      AND i.category.id IN (
                            SELECT c.id
                            FROM Category c
                            WHERE c.id = :categoryId OR c.parent.id = :categoryId
                      )
                      AND (
                            :itemMode IS NULL
                         OR i.itemMode = :itemMode
                         OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
                      )
                      AND NOT EXISTS (
                            SELECT 1
                            FROM ItemFilter f
                            WHERE f.item.id = i.id
                      )
                    ORDER BY i.sortOrder ASC, i.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(i)
                    FROM Item i
                    WHERE i.useYn = true
                      AND i.category.id IN (
                            SELECT c.id
                            FROM Category c
                            WHERE c.id = :categoryId OR c.parent.id = :categoryId
                      )
                      AND (
                            :itemMode IS NULL
                         OR i.itemMode = :itemMode
                         OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
                      )
                      AND NOT EXISTS (
                            SELECT 1
                            FROM ItemFilter f
                            WHERE f.item.id = i.id
                      )
                    """
    )
    Page<Item> findActiveWithoutFilterByCategoryIdPaged(
            @Param("categoryId") Long categoryId,
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    @Query(
            value = """
                    SELECT i
                    FROM Item i
                    LEFT JOIN FETCH i.brand
                    LEFT JOIN FETCH i.category
                    WHERE i.useYn = true
                      AND i.category.id IN (
                            SELECT c.id
                            FROM Category c
                            WHERE c.id = :categoryId OR c.parent.id = :categoryId
                      )
                      AND (
                            :itemMode IS NULL
                         OR i.itemMode = :itemMode
                         OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
                      )
                      AND NOT EXISTS (
                            SELECT 1
                            FROM ItemTag t
                            WHERE t.item.id = i.id
                      )
                    ORDER BY i.sortOrder ASC, i.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(i)
                    FROM Item i
                    WHERE i.useYn = true
                      AND i.category.id IN (
                            SELECT c.id
                            FROM Category c
                            WHERE c.id = :categoryId OR c.parent.id = :categoryId
                      )
                      AND (
                            :itemMode IS NULL
                         OR i.itemMode = :itemMode
                         OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
                      )
                      AND NOT EXISTS (
                            SELECT 1
                            FROM ItemTag t
                            WHERE t.item.id = i.id
                      )
                    """
    )
    Page<Item> findActiveWithoutTagByCategoryIdPaged(
            @Param("categoryId") Long categoryId,
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    /**
     * RENTAL/BOTH 아이템 중 ItemOption 이 하나도 없는 것 조회 (재고 초기화용)
     */
    @Query("""
            SELECT i FROM Item i
            WHERE (i.itemMode = 'RENTAL' OR i.itemMode = 'BOTH')
              AND NOT EXISTS (SELECT 1 FROM ItemOption io WHERE io.item.id = i.id)
            """)
    List<Item> findRentalItemsWithoutOptions();

    /**
     * 카테고리 삭제 시 해당 카테고리를 참조하는 상품의 category_id를 null로 초기화
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Item i SET i.category = null WHERE i.category.id = :categoryId")
    void nullifyCategoryId(@Param("categoryId") Long categoryId);

    /**
     * 브랜드 삭제 시 해당 브랜드를 참조하는 상품의 brand_id를 null로 초기화
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Item i SET i.brand = null WHERE i.brand.id = :brandId")
    void nullifyBrandId(@Param("brandId") Long brandId);

    /**
     * 특정 태그 이름을 가진 상품의 itemMode를 일괄 변경
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Item i SET i.itemMode = :mode WHERE i.id IN " +
            "(SELECT it.item.id FROM ItemTag it WHERE it.tag.name = :tagName)")
    int updateItemModeByTagName(@Param("tagName") String tagName, @Param("mode") String mode);

    List<Item> findByRetailPriceGreaterThanEqual(int minPrice);

    /** 가격 >= threshold 인 아이템 itemMode 일괄 변경 */
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE Item i SET i.itemMode = :mode WHERE i.retailPrice >= :threshold")
    int updateItemModeByPriceGte(@Param("threshold") int threshold, @Param("mode") String mode);

    /** 가격 < threshold 인 아이템 itemMode 일괄 변경 */
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE Item i SET i.itemMode = :mode WHERE i.retailPrice < :threshold")
    int updateItemModeByPriceLt(@Param("threshold") int threshold, @Param("mode") String mode);

    /** 지정된 ID 목록의 아이템 itemMode 일괄 변경 */
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE Item i SET i.itemMode = :mode WHERE i.id IN :ids")
    int updateItemModeByIds(@Param("ids") List<Long> ids, @Param("mode") String mode);

    /** 카테고리 코드 기준 전체 아이템 조회 (동기화용, useYn 무관) */
    @Query("SELECT i FROM Item i LEFT JOIN i.category.parent cat_parent WHERE i.category.code = :categoryCode OR cat_parent.code = :categoryCode")
    List<Item> findByCategoryCodeForSync(@Param("categoryCode") String categoryCode);

    @Query("""
            SELECT i
            FROM Item i
            LEFT JOIN FETCH i.brand
            LEFT JOIN FETCH i.category
            WHERE i.useYn = true
              AND (
                    :itemMode IS NULL
                 OR i.itemMode = :itemMode
                 OR i.itemMode = 'BOTH'
              )
            ORDER BY i.likeCnt DESC, i.viewCnt DESC, i.id DESC
            """)
    List<Item> findTopActiveByMode(
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    @Query("""
            SELECT i
            FROM Item i
            LEFT JOIN FETCH i.brand
            LEFT JOIN FETCH i.category
            WHERE i.useYn = true
              AND (
                    :itemMode IS NULL
                 OR i.itemMode = :itemMode
                 OR i.itemMode = 'BOTH'
              )
            ORDER BY i.id DESC
            """)
    List<Item> findRecentActiveByMode(
            @Param("itemMode") String itemMode,
            Pageable pageable
    );

    @Query("""
            SELECT i
            FROM Item i
            LEFT JOIN FETCH i.brand
            LEFT JOIN FETCH i.category
            WHERE i.id IN :ids
            """)
    List<Item> findByIdInWithBrandAndCategory(@Param("ids") List<Long> ids);

    @Query("""
            SELECT COUNT(i)
            FROM Item i
            LEFT JOIN i.category.parent cat_parent
            WHERE i.useYn = true
              AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
              AND (
                    :itemMode IS NULL
                 OR i.itemMode = :itemMode
                 OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
              )
            """)
    long countActiveByCategoryCodeForDiagnose(
            @Param("categoryCode") String categoryCode,
            @Param("itemMode") String itemMode
    );

    @Query("""
            SELECT COUNT(i)
            FROM Item i
            LEFT JOIN i.category.parent cat_parent
            WHERE i.useYn = true
              AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
              AND (
                    :itemMode IS NULL
                 OR i.itemMode = :itemMode
                 OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
              )
              AND NOT EXISTS (
                    SELECT 1
                    FROM ItemFilter f
                    WHERE f.item.id = i.id
              )
            """)
    long countActiveByCategoryCodeWithoutFilterMappingForDiagnose(
            @Param("categoryCode") String categoryCode,
            @Param("itemMode") String itemMode
    );

    @Query("""
            SELECT COUNT(i)
            FROM Item i
            LEFT JOIN i.category.parent cat_parent
            WHERE i.useYn = true
              AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
              AND (
                    :itemMode IS NULL
                 OR i.itemMode = :itemMode
                 OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
              )
              AND EXISTS (
                    SELECT 1
                    FROM ItemFilter f
                    WHERE f.item.id = i.id
                      AND f.tag.id IN :filterIds
              )
            """)
    long countActiveByCategoryCodeWithAnyFilterIdsForDiagnose(
            @Param("categoryCode") String categoryCode,
            @Param("filterIds") List<Long> filterIds,
            @Param("itemMode") String itemMode
    );

    @Query("""
            SELECT COUNT(i)
            FROM Item i
            LEFT JOIN i.category.parent cat_parent
            WHERE i.useYn = true
              AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
              AND (
                    :itemMode IS NULL
                 OR i.itemMode = :itemMode
                 OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
              )
              AND (
                    SELECT COUNT(DISTINCT f.tag.id)
                    FROM ItemFilter f
                    WHERE f.item.id = i.id
                      AND f.tag.id IN :filterIds
              ) = :filterCount
            """)
    long countActiveByCategoryCodeWithAllFilterIdsForDiagnose(
            @Param("categoryCode") String categoryCode,
            @Param("filterIds") List<Long> filterIds,
            @Param("filterCount") long filterCount,
            @Param("itemMode") String itemMode
    );

    @Query("""
            SELECT COUNT(i)
            FROM Item i
            LEFT JOIN i.category.parent cat_parent
            WHERE i.useYn = true
              AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
              AND (
                    :itemMode IS NULL
                 OR i.itemMode = :itemMode
                 OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
              )
              AND NOT EXISTS (
                    SELECT 1
                    FROM ItemFilter f
                    WHERE f.item.id = i.id
                      AND f.tag.id IN :filterIds
              )
            """)
    long countActiveByCategoryCodeWithoutSelectedFilterIdsForDiagnose(
            @Param("categoryCode") String categoryCode,
            @Param("filterIds") List<Long> filterIds,
            @Param("itemMode") String itemMode
    );

    @Query("""
            SELECT i.id
            FROM Item i
            LEFT JOIN i.category.parent cat_parent
            WHERE i.useYn = true
              AND (i.category.code = :categoryCode OR cat_parent.code = :categoryCode)
              AND (
                    :itemMode IS NULL
                 OR i.itemMode = :itemMode
                 OR (:itemMode = 'RENTAL' AND i.itemMode = 'BOTH')
              )
              AND NOT EXISTS (
                    SELECT 1
                    FROM ItemFilter f
                    WHERE f.item.id = i.id
              )
            ORDER BY i.id DESC
            """)
    List<Long> findActiveIdsByCategoryCodeWithoutFilterMappingForDiagnose(
            @Param("categoryCode") String categoryCode,
            @Param("itemMode") String itemMode,
            Pageable pageable
    );
}
