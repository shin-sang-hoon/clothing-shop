package com.example.demo.catalog.search.dto;

import java.util.List;

public class SearchRankingDtos {

    public record TrendingKeyword(int rank, String term, String trend, Integer rankChange) {}

    public record RisingKeyword(int rank, String term) {}

    public record SearchRankingsResponse(
            List<TrendingKeyword> popular,
            List<RisingKeyword> rising,
            String updatedAt,
            String cacheSource
    ) {}
}
