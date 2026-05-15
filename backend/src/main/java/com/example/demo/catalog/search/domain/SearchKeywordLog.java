package com.example.demo.catalog.search.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * SearchKeywordLog
 * - 사용자 검색 로그
 * - member(로그인 사용자) 또는 ip 기반으로 검색 이력을 저장한다.
 */
@Entity
@Table(
        name = "search_keyword_log",
        indexes = {
                @Index(name = "idx_search_keyword_log_member_id", columnList = "member_id"),
                @Index(name = "idx_search_keyword_log_keyword", columnList = "keyword"),
                @Index(name = "idx_search_keyword_log_normalized_keyword", columnList = "normalized_keyword"),
                @Index(name = "idx_search_keyword_log_member_email", columnList = "member_email"),
                @Index(name = "idx_search_keyword_log_ip_address", columnList = "ip_address"),
                @Index(name = "idx_search_keyword_log_searched_at", columnList = "searched_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class SearchKeywordLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 검색 회원 (비로그인은 null)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    /**
     * 원본 검색어
     */
    @Column(name = "keyword", nullable = false, length = 200)
    private String keyword;

    /**
     * 검색 회원 이메일 (비로그인은 null)
     * - 로그 조회 성능을 위해 member 관계와 별도로 저장
     */
    @Column(name = "member_email", length = 190)
    private String memberEmail;

    /**
     * 정규화 검색어
     * - trim + lower-case + 다중 공백 축약
     */
    @Column(name = "normalized_keyword", nullable = false, length = 200)
    private String normalizedKeyword;

    /**
     * 요청 IP
     */
    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    /**
     * 요청 User-Agent
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * 검색 시각
     */
    @Column(name = "searched_at", nullable = false)
    private LocalDateTime searchedAt = ApiDateTimeConverter.nowKst();
}
