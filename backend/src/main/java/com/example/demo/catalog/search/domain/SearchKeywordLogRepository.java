package com.example.demo.catalog.search.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SearchKeywordLogRepository extends JpaRepository<SearchKeywordLog, Long>, JpaSpecificationExecutor<SearchKeywordLog> {

    @Query("""
            SELECT l.normalizedKeyword, COUNT(l) as cnt
            FROM SearchKeywordLog l
            WHERE l.searchedAt >= :since
            GROUP BY l.normalizedKeyword
            ORDER BY cnt DESC
            """)
    List<Object[]> findTopKeywordsFrom(
            @Param("since") LocalDateTime since,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("""
            SELECT COUNT(l) > 0
            FROM SearchKeywordLog l
            WHERE l.normalizedKeyword = :normalizedKeyword
              AND l.searchedAt >= :since
              AND (
                    (:memberEmail IS NOT NULL AND l.memberEmail = :memberEmail)
                 OR (:memberEmail IS NULL AND l.memberEmail IS NULL AND :ipAddress IS NOT NULL AND l.ipAddress = :ipAddress)
              )
            """)
    boolean existsDuplicateWithinWindow(
            @Param("normalizedKeyword") String normalizedKeyword,
            @Param("memberEmail") String memberEmail,
            @Param("ipAddress") String ipAddress,
            @Param("since") LocalDateTime since
    );

    @Query("""
            SELECT l.normalizedKeyword
            FROM SearchKeywordLog l
            WHERE l.memberEmail = :memberEmail
            ORDER BY l.searchedAt DESC, l.id DESC
            """)
    List<String> findRecentNormalizedKeywordsByMemberEmail(
            @Param("memberEmail") String memberEmail,
            org.springframework.data.domain.Pageable pageable
    );
}
