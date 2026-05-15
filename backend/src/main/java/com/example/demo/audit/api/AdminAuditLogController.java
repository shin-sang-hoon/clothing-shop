package com.example.demo.audit.api;

import com.example.demo.audit.application.AdminAuditLogQueryService;
import com.example.demo.audit.dto.AuditLogDtos;
import com.example.demo.global.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AdminAuditLogQueryService adminAuditLogQueryService;

    @GetMapping
    public PageResponse<AuditLogDtos.AuditLogResponse> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String keyword
    ) {
        return adminAuditLogQueryService.getAuditLogs(page, size, category, result, keyword);
    }
}
