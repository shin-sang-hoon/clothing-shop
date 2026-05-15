package com.example.demo.review.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_report",
    indexes = {
        @Index(name = "idx_review_report_review_id", columnList = "review_id"),
        @Index(name = "idx_review_report_reporter_id", columnList = "reporter_id")
    })
@Getter @Setter @NoArgsConstructor
public class ReviewReport {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "review_id", nullable = false)
    private Long reviewId;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "reporter_name", length = 100)
    private String reporterName;

    @Column(name = "review_content", length = 2000)
    private String reviewContent;

    @Column(name = "review_author", length = 100)
    private String reviewAuthor;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(length = 500)
    private String handledNote;

    @Column(nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
