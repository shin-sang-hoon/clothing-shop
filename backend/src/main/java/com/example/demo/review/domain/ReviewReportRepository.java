package com.example.demo.review.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewReportRepository extends JpaRepository<ReviewReport, Long> {
    boolean existsByReviewIdAndReporterId(Long reviewId, Long reporterId);
    List<ReviewReport> findAllByOrderByCreatedAtDesc();
}
