package com.example.demo.catalog.search.dto;

import com.example.demo.catalog.search.domain.MemberFilterActionLog;
import com.example.demo.global.time.ApiDateTimeConverter;

public class MemberFilterActionLogDtos {

    public record MemberFilterActionLogResponse(
            Long id,
            Long memberId,
            String memberEmail,
            Long filterId,
            String filterName,
            String ipAddress,
            String userAgent,
            String occurredAt
    ) {
        public static MemberFilterActionLogResponse from(MemberFilterActionLog log) {
            return new MemberFilterActionLogResponse(
                    log.getId(),
                    log.getMember() != null ? log.getMember().getId() : null,
                    log.getMemberEmail(),
                    log.getFilter() != null ? log.getFilter().getId() : null,
                    log.getFilter() != null ? log.getFilter().getName() : null,
                    log.getIpAddress(),
                    log.getUserAgent(),
                    ApiDateTimeConverter.toUtcString(log.getOccurredAt())
            );
        }
    }
}
