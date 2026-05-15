package com.example.demo.catalog.search.domain;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MemberFilterActionLogRepository extends JpaRepository<MemberFilterActionLog, Long>,
        JpaSpecificationExecutor<MemberFilterActionLog> {

    interface FilterUsageCount {
        Long getFilterId();
        Long getActionCount();
    }

    @Query("""
            SELECT COUNT(l) > 0
            FROM MemberFilterActionLog l
            WHERE l.filter.id = :filterId
              AND l.occurredAt >= :since
              AND (
                    (:memberEmail IS NOT NULL AND l.memberEmail = :memberEmail)
                 OR (:memberEmail IS NULL AND l.memberEmail IS NULL AND :ipAddress IS NOT NULL AND l.ipAddress = :ipAddress)
              )
            """)
    boolean existsDuplicateWithinWindow(
            @Param("filterId") Long filterId,
            @Param("memberEmail") String memberEmail,
            @Param("ipAddress") String ipAddress,
            @Param("since") LocalDateTime since
    );

    @Query("""
            SELECT l.filter.id AS filterId, COUNT(l) AS actionCount
            FROM MemberFilterActionLog l
            WHERE l.memberEmail = :memberEmail
              AND l.occurredAt >= :since
            GROUP BY l.filter.id
            ORDER BY actionCount DESC
            """)
    List<FilterUsageCount> findRecentFilterUsageByMemberEmail(
            @Param("memberEmail") String memberEmail,
            @Param("since") LocalDateTime since,
            Pageable pageable
    );
}
