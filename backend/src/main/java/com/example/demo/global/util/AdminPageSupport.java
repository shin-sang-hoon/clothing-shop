package com.example.demo.global.util;

import com.example.demo.global.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

public final class AdminPageSupport {

    private AdminPageSupport() {
    }

    public static Pageable createPageable(int page, int size, int defaultSize) {
        return PageRequest.of(Math.max(page, 0), size <= 0 ? defaultSize : size);
    }

    public static <T> PageResponse<T> toPageResponse(List<T> content, Pageable pageable) {
        int totalElements = content.size();
        int totalPages = totalElements == 0
                ? 0
                : (int) Math.ceil((double) totalElements / pageable.getPageSize());
        int fromIndex = Math.min((int) pageable.getOffset(), totalElements);
        int toIndex = Math.min(fromIndex + pageable.getPageSize(), totalElements);

        return new PageResponse<>(
                content.subList(fromIndex, toIndex),
                pageable.getPageNumber(),
                pageable.getPageSize(),
                totalElements,
                totalPages,
                pageable.getPageNumber() == 0,
                totalPages == 0 || pageable.getPageNumber() >= totalPages - 1
        );
    }
}
