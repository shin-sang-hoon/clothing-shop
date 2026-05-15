package com.example.demo.catalog.search.api;

import com.example.demo.catalog.search.application.SearchRankingService;
import com.example.demo.catalog.search.dto.SearchRankingDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

/**
 * PublicSearchRankingController
 * - GET /api/public/search/rankings
 * - 인기 검색어 + 급상승 검색어 반환 (5분 캐시)
 */
@RestController
@RequestMapping("/api/public/search")
@RequiredArgsConstructor
public class PublicSearchRankingController {

    private final SearchRankingService searchRankingService;

    @GetMapping("/rankings")
    public SearchRankingDtos.SearchRankingsResponse getRankings() {
        SearchRankingService.CachedRankings result = searchRankingService.getCache();
        SearchRankingDtos.SearchRankingsResponse cached = result.payload();
        if (cached == null) {
            return new SearchRankingDtos.SearchRankingsResponse(
                    Collections.emptyList(), Collections.emptyList(), null, "MISS"
            );
        }
        return new SearchRankingDtos.SearchRankingsResponse(
                cached.popular(),
                cached.rising(),
                cached.updatedAt(),
                result.cacheSource()
        );
    }
}
