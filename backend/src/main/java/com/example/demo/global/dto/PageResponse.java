package com.example.demo.global.dto;

import java.util.List;

/**
 * PageResponse
 * - 관리자/공통 목록형 API에서 사용하는 페이징 응답 DTO
 * - 프론트가 공통으로 사용할 수 있도록 page 정보 필드를 고정한다.
 *
 * @param content       목록 데이터
 * @param page          현재 페이지 번호(0-base)
 * @param size          페이지 크기
 * @param totalElements 전체 건수
 * @param totalPages    전체 페이지 수
 * @param first         첫 페이지 여부
 * @param last          마지막 페이지 여부
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}