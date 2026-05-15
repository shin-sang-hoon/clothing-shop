package com.example.demo.review.application;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import com.example.demo.review.domain.Review;
import com.example.demo.review.domain.ReviewReport;
import com.example.demo.review.domain.ReviewReportRepository;
import com.example.demo.review.domain.ReviewRepository;
import com.example.demo.review.dto.ReviewDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;

    private final ReviewRepository reviewRepository;
    private final ReviewReportRepository reviewReportRepository;
    private final ItemRepository itemRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public ReviewDtos.ReviewResponse submitReview(
            String email, Long itemId, int rating, String content,
            String size, Integer height, Integer weight,
            MultipartFile photo) {

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        String photoUrl = null;
        if (photo != null && !photo.isEmpty()) {
            try {
                photoUrl = savePhoto(photo);
            } catch (IOException e) {
                throw new IllegalStateException("사진 저장에 실패했습니다.");
            }
        }

        Review review = new Review();
        review.setItem(item);
        review.setMember(member);
        review.setRating(rating);
        review.setContent(content);
        review.setSize(size);
        review.setHeight(height);
        review.setWeight(weight);
        review.setPhotoUrl(photoUrl);

        return toResponse(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public ReviewDtos.ReviewPageResponse getItemReviews(Long itemId, int page, int size) {
        Page<Review> p = reviewRepository.findByItemIdOrderByCreatedAtDesc(itemId, PageRequest.of(page, size));
        return new ReviewDtos.ReviewPageResponse(
                p.getContent().stream().map(this::toResponse).toList(),
                p.getNumber(), p.getSize(), p.getTotalElements(),
                p.getTotalPages(), p.isFirst(), p.isLast()
        );
    }

    /** 리뷰 삭제 - 본인 또는 관리자만 */
    @Transactional
    public void deleteReview(Long reviewId, String email, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));
        if (!isAdmin) {
            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
            if (!review.getMember().getId().equals(member.getId())) {
                throw new SecurityException("삭제 권한이 없습니다.");
            }
        }
        reviewRepository.delete(review);
    }

    /** 리뷰 신고 */
    @Transactional
    public ReviewDtos.ReviewReportResponse reportReview(Long reviewId, String reporterEmail, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));
        Member reporter = memberRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        if (reviewReportRepository.existsByReviewIdAndReporterId(reviewId, reporter.getId())) {
            throw new IllegalStateException("이미 신고한 리뷰입니다.");
        }

        ReviewReport report = new ReviewReport();
        report.setReviewId(reviewId);
        report.setReporterId(reporter.getId());
        report.setReporterName(reporter.getName());
        report.setReviewContent(review.getContent());
        report.setReviewAuthor(review.getMember().getName());
        report.setReason(reason);

        return toReportResponse(reviewReportRepository.save(report));
    }

    /** 관리자: 신고 처리 (RESOLVE=리뷰삭제+RESOLVED, DISMISS=DISMISSED) */
    @Transactional
    public ReviewDtos.ReviewReportResponse handleReviewReport(Long reportId, String action, String note) {
        ReviewReport report = reviewReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));

        if ("RESOLVE".equalsIgnoreCase(action)) {
            reviewRepository.findById(report.getReviewId()).ifPresent(reviewRepository::delete);
            report.setStatus("RESOLVED");
        } else if ("DISMISS".equalsIgnoreCase(action)) {
            report.setStatus("DISMISSED");
        } else {
            throw new IllegalArgumentException("action은 RESOLVE 또는 DISMISS 이어야 합니다.");
        }

        if (note != null && !note.isBlank()) {
            report.setHandledNote(note.trim());
        }

        return toReportResponse(reviewReportRepository.save(report));
    }

    /** 관리자: 신고된 리뷰 목록 */
    @Transactional(readOnly = true)
    public List<ReviewDtos.ReviewReportResponse> getAdminReviewReports() {
        return reviewReportRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toReportResponse).toList();
    }

    private ReviewDtos.ReviewReportResponse toReportResponse(ReviewReport r) {
        return new ReviewDtos.ReviewReportResponse(
                r.getId(), r.getReviewId(), r.getReporterId(), r.getReporterName(),
                r.getReviewContent(), r.getReviewAuthor(), r.getReason(), r.getStatus(),
                r.getHandledNote(),
                r.getCreatedAt() != null ? r.getCreatedAt().format(DATE_FORMATTER) : null
        );
    }

    private String savePhoto(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
        int dot = original.lastIndexOf('.');
        String ext = dot >= 0 ? original.substring(dot).toLowerCase() : "";
        String fileName = UUID.randomUUID() + ext;
        Path dir = Path.of(uploadRoot, "review").toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Files.write(dir.resolve(fileName), file.getBytes());
        return "/uploads/review/" + fileName;
    }

    private ReviewDtos.ReviewResponse toResponse(Review r) {
        return new ReviewDtos.ReviewResponse(
                r.getId(),
                r.getMember().getId(),
                r.getMember().getName(),
                r.getRating(),
                r.getContent(),
                r.getSize(),
                r.getHeight(),
                r.getWeight(),
                r.getPhotoUrl(),
                r.getCreatedAt() != null ? r.getCreatedAt().format(DATE_FORMATTER) : null
        );
    }
}
