package com.example.demo.catalog.item.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * ItemViewLog
 * - 상품 상세 조회 로그 (조회수 dedup 기준 데이터)
 */
@Entity
@Table(
        name = "item_view_log",
        indexes = {
                @Index(name = "idx_item_view_log_item_id", columnList = "item_id"),
                @Index(name = "idx_item_view_log_member_email", columnList = "member_email"),
                @Index(name = "idx_item_view_log_ip_address", columnList = "ip_address"),
                @Index(name = "idx_item_view_log_viewed_at", columnList = "viewed_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ItemViewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(name = "member_email", length = 190)
    private String memberEmail;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt = ApiDateTimeConverter.nowKst();
}
