package com.example.demo.catalog.search.application;

import com.example.demo.catalog.search.domain.SearchKeywordLogRepository;
import com.example.demo.catalog.search.dto.SearchRankingDtos;
import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * SearchRankingService
 * - 검색 랭킹(인기/급상승)을 DB 로그로 집계하고 Redis 캐시에 저장
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SearchRankingService {

    private static final String SEARCH_RANKINGS_KEY = "search:rankings:v1";
    private static final String SEARCH_PREV_RANK_KEY = "search:popular:prev-rank:v1";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final SearchKeywordLogRepository searchKeywordLogRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private volatile SearchRankingDtos.SearchRankingsResponse localCache = null;
    public record CachedRankings(SearchRankingDtos.SearchRankingsResponse payload, String cacheSource) {}

    @PostConstruct
    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional(readOnly = true)
    public void refresh() {
        LocalDateTime now = ApiDateTimeConverter.nowKst();
        LocalDateTime yesterday = now.minusHours(24);
        LocalDateTime todayMidnight = now.toLocalDate().atStartOfDay();

        PageRequest top10 = PageRequest.of(0, 10);

        List<Object[]> popularRows = searchKeywordLogRepository.findTopKeywordsFrom(yesterday, top10);
        Map<String, Integer> previousPopularRanks = getPreviousPopularRanks();
        Map<String, Integer> currentRanks = new LinkedHashMap<>();
        List<SearchRankingDtos.TrendingKeyword> popular = new ArrayList<>();

        for (int i = 0; i < popularRows.size(); i++) {
            String keyword = Objects.toString(popularRows.get(i)[0], null);
            if (keyword == null || keyword.isBlank()) {
                continue;
            }

            int rank = i + 1;
            currentRanks.put(keyword, rank);

            Integer prevRank = previousPopularRanks.get(keyword);
            String trend;
            Integer rankChange = null;
            if (prevRank == null) {
                trend = "none";
            } else if (prevRank > rank) {
                trend = "up";
                rankChange = prevRank - rank;
            } else if (prevRank < rank) {
                trend = "down";
                rankChange = rank - prevRank;
            } else {
                trend = "none";
            }
            popular.add(new SearchRankingDtos.TrendingKeyword(rank, keyword, trend, rankChange));
        }

        List<Object[]> risingRows = searchKeywordLogRepository.findTopKeywordsFrom(todayMidnight, top10);
        List<SearchRankingDtos.RisingKeyword> rising = new ArrayList<>();
        for (int i = 0; i < risingRows.size(); i++) {
            String keyword = Objects.toString(risingRows.get(i)[0], null);
            if (keyword == null || keyword.isBlank()) {
                continue;
            }
            rising.add(new SearchRankingDtos.RisingKeyword(i + 1, keyword));
        }

        SearchRankingDtos.SearchRankingsResponse response = new SearchRankingDtos.SearchRankingsResponse(
                popular,
                rising,
                ApiDateTimeConverter.toUtcString(now),
                "BUILD"
        );

        localCache = response;
        saveToRedis(response, currentRanks);
    }

    @SuppressWarnings("unchecked")
    public CachedRankings getCache() {
        Object cached = redisTemplate.opsForValue().get(SEARCH_RANKINGS_KEY);
        if (cached instanceof SearchRankingDtos.SearchRankingsResponse response) {
            log.info("[REDIS HIT] key={}", SEARCH_RANKINGS_KEY);
            localCache = response;
            return new CachedRankings(response, "HIT");
        }
        if (cached instanceof Map<?, ?> map) {
            try {
                Object popularRaw = map.get("popular");
                Object risingRaw = map.get("rising");
                List<SearchRankingDtos.TrendingKeyword> popular =
                        (popularRaw instanceof List<?> popularList
                                ? (List<Map<String, Object>>) popularList
                                : List.<Map<String, Object>>of()).stream()
                                .map(row -> new SearchRankingDtos.TrendingKeyword(
                                        toInt(row.get("rank")),
                                        Objects.toString(row.get("term"), ""),
                                        Objects.toString(row.get("trend"), "none"),
                                        row.get("rankChange") != null ? toInt(row.get("rankChange")) : null
                                ))
                                .toList();

                List<SearchRankingDtos.RisingKeyword> rising =
                        (risingRaw instanceof List<?> risingList
                                ? (List<Map<String, Object>>) risingList
                                : List.<Map<String, Object>>of()).stream()
                                .map(row -> new SearchRankingDtos.RisingKeyword(
                                        toInt(row.get("rank")),
                                        Objects.toString(row.get("term"), "")
                                ))
                                .toList();

                SearchRankingDtos.SearchRankingsResponse response = new SearchRankingDtos.SearchRankingsResponse(
                        popular,
                        rising,
                        Objects.toString(map.get("updatedAt"), null),
                        "HIT"
                );
                log.info("[REDIS HIT] key={} (map payload)", SEARCH_RANKINGS_KEY);
                localCache = response;
                return new CachedRankings(response, "HIT");
            } catch (RuntimeException ignored) {
                // fall through
            }
        }

        log.info("[REDIS MISS] key={} -> fallback local cache", SEARCH_RANKINGS_KEY);
        return new CachedRankings(localCache, "MISS");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Integer> getPreviousPopularRanks() {
        Object raw = redisTemplate.opsForValue().get(SEARCH_PREV_RANK_KEY);
        if (!(raw instanceof Map<?, ?> map)) {
            return Collections.emptyMap();
        }
        Map<String, Integer> parsed = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            String key = Objects.toString(entry.getKey(), null);
            if (key == null) {
                continue;
            }
            parsed.put(key, toInt(entry.getValue()));
        }
        return parsed;
    }

    private void saveToRedis(
            SearchRankingDtos.SearchRankingsResponse rankings,
            Map<String, Integer> currentRanks
    ) {
        redisTemplate.opsForValue().set(SEARCH_RANKINGS_KEY, rankings, CACHE_TTL);
        redisTemplate.opsForValue().set(SEARCH_PREV_RANK_KEY, currentRanks, Duration.ofDays(1));
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return 0;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
