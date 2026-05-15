package com.example.demo.catalog.item.api;

import com.example.demo.catalog.item.application.HomeItemRankingService;
import com.example.demo.catalog.item.dto.HomeItemDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/home/items")
@RequiredArgsConstructor
public class PublicHomeItemController {

    private final HomeItemRankingService homeItemRankingService;

    @GetMapping("/popular")
    public HomeItemDtos.HomeItemListResponse getPopularItems(
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String itemMode
    ) {
        HomeItemRankingService.CachedItemList result = homeItemRankingService.getPopularItems(itemMode, size);
        return new HomeItemDtos.HomeItemListResponse(result.items(), result.cacheSource());
    }

    @GetMapping("/recommend")
    public HomeItemDtos.HomeItemListResponse getRecommendItems(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String itemMode
    ) {
        HomeItemRankingService.CachedItemList result = homeItemRankingService.getRecommendItems(email, itemMode, size);
        return new HomeItemDtos.HomeItemListResponse(result.items(), result.cacheSource());
    }
}
