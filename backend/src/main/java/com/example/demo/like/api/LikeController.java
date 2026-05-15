package com.example.demo.like.api;

import com.example.demo.like.application.LikeService;
import com.example.demo.like.dto.LikeDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * LikeController
 * - 상품/브랜드 좋아요 API
 * - 인증 필요 (JWT)
 */
@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    // ── 상품 좋아요 ──────────────────────────────────────────────

    /** 상품 좋아요 추가 */
    @PostMapping("/items/{itemId}")
    public ResponseEntity<LikeDtos.LikeToggleResponse> likeItem(
            @PathVariable Long itemId,
            Authentication authentication
    ) {
        LikeDtos.LikeToggleResponse res = likeService.likeItem(authentication.getName(), itemId);
        return ResponseEntity.ok(res);
    }

    /** 상품 좋아요 삭제 */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<LikeDtos.LikeToggleResponse> unlikeItem(
            @PathVariable Long itemId,
            Authentication authentication
    ) {
        LikeDtos.LikeToggleResponse res = likeService.unlikeItem(authentication.getName(), itemId);
        return ResponseEntity.ok(res);
    }

    /** 상품 좋아요 여부 조회 */
    @GetMapping("/items/{itemId}/status")
    public ResponseEntity<LikeDtos.LikeToggleResponse> itemLikeStatus(
            @PathVariable Long itemId,
            Authentication authentication
    ) {
        boolean liked = likeService.isItemLiked(authentication.getName(), itemId);
        return ResponseEntity.ok(new LikeDtos.LikeToggleResponse(liked, 0));
    }

    /** 내 좋아요 상품 목록 (item_like 테이블 기준) */
    @GetMapping("/items")
    public ResponseEntity<List<LikeDtos.LikedItemResponse>> myLikedItems(Authentication authentication) {
        List<LikeDtos.LikedItemResponse> items = likeService.getMyLikedItems(authentication.getName());
        return ResponseEntity.ok(items);
    }

    // ── 브랜드 좋아요 ─────────────────────────────────────────────

    /** 브랜드 좋아요 추가 */
    @PostMapping("/brands/{brandId}")
    public ResponseEntity<LikeDtos.LikeToggleResponse> likeBrand(
            @PathVariable Long brandId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(likeService.likeBrand(authentication.getName(), brandId));
    }

    /** 브랜드 좋아요 삭제 */
    @DeleteMapping("/brands/{brandId}")
    public ResponseEntity<LikeDtos.LikeToggleResponse> unlikeBrand(
            @PathVariable Long brandId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(likeService.unlikeBrand(authentication.getName(), brandId));
    }

    /** 브랜드 좋아요 여부 조회 */
    @GetMapping("/brands/{brandId}/status")
    public ResponseEntity<LikeDtos.LikeToggleResponse> brandLikeStatus(
            @PathVariable Long brandId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(likeService.getBrandLikeStatus(authentication.getName(), brandId));
    }

    /** 내 좋아요 브랜드 목록 */
    @GetMapping("/brands")
    public ResponseEntity<List<LikeDtos.LikedBrandResponse>> myLikedBrands(Authentication authentication) {
        List<LikeDtos.LikedBrandResponse> brands = likeService.getMyLikedBrands(authentication.getName());
        return ResponseEntity.ok(brands);
    }
}
