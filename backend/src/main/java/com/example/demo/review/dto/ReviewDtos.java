package com.example.demo.review.dto;

public class ReviewDtos {

    public record ReviewResponse(
            Long id,
            Long memberId,
            String memberName,
            Integer rating,
            String content,
            String size,
            Integer height,
            Integer weight,
            String photoUrl,
            String createdAt
    ) {}

    public record ReviewPageResponse(
            java.util.List<ReviewResponse> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean first,
            boolean last
    ) {}

    public record ReviewReportRequest(String reason) {}

    public record ReviewReportHandleRequest(String action, String note) {}

    public record ReviewReportResponse(
            Long id,
            Long reviewId,
            Long reporterId,
            String reporterName,
            String reviewContent,
            String reviewAuthor,
            String reason,
            String status,
            String handledNote,
            String createdAt
    ) {}
}
