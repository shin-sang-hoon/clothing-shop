package com.example.demo.catalog.search.api;

import com.example.demo.catalog.search.application.AdminSearchKeywordLogQueryService;
import com.example.demo.catalog.search.dto.SearchKeywordLogDtos;
import com.example.demo.global.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/search-logs")
@RequiredArgsConstructor
public class AdminSearchKeywordLogController {

    private final AdminSearchKeywordLogQueryService adminSearchKeywordLogQueryService;

    @GetMapping
    public PageResponse<SearchKeywordLogDtos.SearchKeywordLogResponse> getSearchLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String memberEmail,
            @RequestParam(required = false) String ipAddress
    ) {
        return adminSearchKeywordLogQueryService.getSearchLogs(page, size, keyword, memberEmail, ipAddress);
    }
}
