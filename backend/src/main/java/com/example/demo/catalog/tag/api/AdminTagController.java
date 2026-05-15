package com.example.demo.catalog.tag.api;

import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.catalog.tag.application.TagService;
import com.example.demo.catalog.tag.dto.AdminTagDtos;
import com.example.demo.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/tags")
@RequiredArgsConstructor
public class AdminTagController {

    private final TagService tagService;
    private final AuditLogService auditLogService;

    @GetMapping
    public PageResponse<AdminTagDtos.TagListResponse> getTags(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn
    ) {
        return tagService.getTags(page, size, keyword, useYn);
    }

    @GetMapping("/{tagId}")
    public AdminTagDtos.TagDetailResponse getTag(@PathVariable Long tagId) {
        return tagService.getTag(tagId);
    }

    @PostMapping
    public AdminTagDtos.TagDetailResponse createTag(
            @Valid @RequestBody AdminTagDtos.CreateTagRequest req,
            HttpServletRequest request
    ) {
        AdminTagDtos.TagDetailResponse response = tagService.createTag(req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.TAG_CREATE,
                "태그 생성: tagId=" + response.id() + ", code=" + response.code(),
                request
        );
        return response;
    }

    @PutMapping("/{tagId}")
    public AdminTagDtos.TagDetailResponse updateTag(
            @PathVariable Long tagId,
            @Valid @RequestBody AdminTagDtos.UpdateTagRequest req,
            HttpServletRequest request
    ) {
        AdminTagDtos.TagDetailResponse response = tagService.updateTag(tagId, req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.TAG_UPDATE,
                "태그 수정: tagId=" + tagId + ", code=" + response.code(),
                request
        );
        return response;
    }

    @PatchMapping("/{tagId}/use")
    public AdminTagDtos.TagDetailResponse updateUseYn(
            @PathVariable Long tagId,
            @Valid @RequestBody AdminTagDtos.UpdateTagUseRequest req,
            HttpServletRequest request
    ) {
        AdminTagDtos.TagDetailResponse response = tagService.updateUseYn(tagId, req);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.TAG_USE_UPDATE,
                "태그 사용여부 변경: tagId=" + tagId + ", useYn=" + req.useYn(),
                request
        );
        return response;
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable Long tagId,
            HttpServletRequest request
    ) {
        tagService.deleteTag(tagId);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.TAG_DELETE,
                "태그 삭제: tagId=" + tagId,
                request
        );
        return ResponseEntity.noContent().build();
    }
}
