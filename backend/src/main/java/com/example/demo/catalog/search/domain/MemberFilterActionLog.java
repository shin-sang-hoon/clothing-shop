package com.example.demo.catalog.search.domain;

import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "member_filter_action_log",
        indexes = {
                @Index(name = "idx_member_filter_action_member_id", columnList = "member_id"),
                @Index(name = "idx_member_filter_action_member_email", columnList = "member_email"),
                @Index(name = "idx_member_filter_action_filter_id", columnList = "filter_id"),
                @Index(name = "idx_member_filter_action_ip_address", columnList = "ip_address"),
                @Index(name = "idx_member_filter_action_occurred_at", columnList = "occurred_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class MemberFilterActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filter_id", nullable = false)
    private Filter filter;

    @Column(name = "member_email", length = 190)
    private String memberEmail;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt = ApiDateTimeConverter.nowKst();
}
