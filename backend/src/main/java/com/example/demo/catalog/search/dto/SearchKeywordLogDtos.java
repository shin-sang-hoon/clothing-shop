package com.example.demo.catalog.search.dto;

import com.example.demo.catalog.search.domain.SearchKeywordLog;
import com.example.demo.global.time.ApiDateTimeConverter;

public class SearchKeywordLogDtos {

    public record SearchKeywordLogResponse(
            Long id,
            Long memberId,
            String memberEmail,
            String keyword,
            String normalizedKeyword,
            String ipAddress,
            String userAgent,
            String searchedAt
    ) {
        public static SearchKeywordLogResponse from(SearchKeywordLog log) {
            return new SearchKeywordLogResponse(
                    log.getId(),
                    log.getMember() != null ? log.getMember().getId() : null,
                    log.getMemberEmail(),
                    log.getKeyword(),
                    log.getNormalizedKeyword(),
                    log.getIpAddress(),
                    log.getUserAgent(),
                    ApiDateTimeConverter.toUtcString(log.getSearchedAt())
            );
        }
    }
}
