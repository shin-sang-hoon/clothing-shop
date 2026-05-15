package com.example.demo.review.api;

import com.example.demo.review.application.ReviewService;
import com.example.demo.review.dto.ReviewDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/api/items/{itemId}/reviews")
    public ResponseEntity<ReviewDtos.ReviewPageResponse> getItemReviews(
            @PathVariable Long itemId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getItemReviews(itemId, page, size));
    }

    @PostMapping("/api/reviews")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewDtos.ReviewResponse> submitReview(
            @AuthenticationPrincipal String email,
            @RequestParam Long itemId,
            @RequestParam int rating,
            @RequestParam String content,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) Integer height,
            @RequestParam(required = false) Integer weight,
            @RequestParam(required = false) MultipartFile photo) {
        return ResponseEntity.ok(
                reviewService.submitReview(email, itemId, rating, content, size, height, weight, photo));
    }

    @DeleteMapping("/api/reviews/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal String email,
            Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PERM_ADMIN_PORTAL_ACCESS"));
        reviewService.deleteReview(reviewId, email, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/reviews/{reviewId}/report")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewDtos.ReviewReportResponse> reportReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal String email,
            @RequestBody ReviewDtos.ReviewReportRequest req) {
        return ResponseEntity.ok(reviewService.reportReview(reviewId, email, req.reason()));
    }

    @GetMapping("/api/admin/review-reports")
    @PreAuthorize("hasAuthority('PERM_ADMIN_PORTAL_ACCESS')")
    public ResponseEntity<List<ReviewDtos.ReviewReportResponse>> getAdminReviewReports() {
        return ResponseEntity.ok(reviewService.getAdminReviewReports());
    }

    @PutMapping("/api/admin/review-reports/{reportId}/handle")
    @PreAuthorize("hasAuthority('PERM_ADMIN_PORTAL_ACCESS')")
    public ResponseEntity<ReviewDtos.ReviewReportResponse> handleReviewReport(
            @PathVariable Long reportId,
            @RequestBody ReviewDtos.ReviewReportHandleRequest req) {
        return ResponseEntity.ok(reviewService.handleReviewReport(reportId, req.action(), req.note()));
    }
}
