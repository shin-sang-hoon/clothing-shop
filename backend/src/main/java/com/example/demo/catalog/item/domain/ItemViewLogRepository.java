package com.example.demo.catalog.item.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface ItemViewLogRepository extends JpaRepository<ItemViewLog, Long> {

    void deleteByItemId(Long itemId);

    @Query("""
            SELECT COUNT(v) > 0
            FROM ItemViewLog v
            WHERE v.item.id = :itemId
              AND v.viewedAt >= :since
              AND (
                    (:memberEmail IS NOT NULL AND v.memberEmail = :memberEmail)
                 OR (:memberEmail IS NULL AND v.memberEmail IS NULL AND :ipAddress IS NOT NULL AND v.ipAddress = :ipAddress)
              )
            """)
    boolean existsDuplicateWithinWindow(
            @Param("itemId") Long itemId,
            @Param("memberEmail") String memberEmail,
            @Param("ipAddress") String ipAddress,
            @Param("since") LocalDateTime since
    );

    @Query("""
            SELECT v.item.id
            FROM ItemViewLog v
            WHERE v.memberEmail = :memberEmail
            ORDER BY v.viewedAt DESC
            """)
    List<Long> findRecentViewedItemIdsByMemberEmail(
            @Param("memberEmail") String memberEmail,
            Pageable pageable
    );
}
