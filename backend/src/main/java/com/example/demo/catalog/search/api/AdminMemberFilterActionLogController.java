package com.example.demo.catalog.search.api;

import com.example.demo.catalog.search.application.AdminMemberFilterActionLogQueryService;
import com.example.demo.catalog.search.dto.MemberFilterActionLogDtos;
import com.example.demo.global.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/search-logs")
@RequiredArgsConstructor
public class AdminMemberFilterActionLogController {

    private final AdminMemberFilterActionLogQueryService adminMemberFilterActionLogQueryService;

    @GetMapping("/filters")
    public PageResponse<MemberFilterActionLogDtos.MemberFilterActionLogResponse> getFilterActionLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String filterName,
            @RequestParam(required = false) String memberEmail,
            @RequestParam(required = false) String ipAddress
    ) {
        return adminMemberFilterActionLogQueryService.getFilterActionLogs(
                page,
                size,
                filterName,
                memberEmail,
                ipAddress
        );
    }
}
