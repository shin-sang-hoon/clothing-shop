package com.example.demo.global.time;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * ApiDateTimeConverter
 * - DB/엔티티에서 사용하는 LocalDateTime을 API 응답용 문자열로 변환한다.
 * - 현재 관리자 화면은 한국 시간 기준으로만 해석하므로 Asia/Seoul을 기준 시간대로 둔다.
 * - 프론트에는 UTC offset 포함 ISO 문자열을 내려주고, 최종 표시는 프론트에서 한국 시간으로 포맷한다.
 */
public final class ApiDateTimeConverter {

    /**
     * 한국 시간대 고정
     */
    public static final ZoneId KOREA_ZONE_ID = ZoneId.of("Asia/Seoul");

    /**
     * ISO 8601 offset 포함 포맷터
     * 예: 2026-03-12T01:01:00Z
     */
    private static final DateTimeFormatter ISO_OFFSET_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private ApiDateTimeConverter() {
    }

    /**
     * nowKst
     * - 서버 기본 타임존에 의존하지 않고 한국 시간 기준 현재 시각을 만든다.
     */
    public static LocalDateTime nowKst() {
        return LocalDateTime.now(KOREA_ZONE_ID);
    }

    /**
     * toUtcString
     * - 한국 시간 기준 LocalDateTime을 UTC offset 포함 문자열로 변환한다.
     * - 프론트는 이 값을 받아 Asia/Seoul로 화면 표시만 담당한다.
     */
    public static String toUtcString(LocalDateTime localDateTime) {
        if (localDateTime == null) {
            return null;
        }

        return localDateTime.atZone(KOREA_ZONE_ID)
                .withZoneSameInstant(ZoneOffset.UTC)
                .format(ISO_OFFSET_FORMATTER);
    }
}