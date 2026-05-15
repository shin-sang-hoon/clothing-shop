package com.example.demo.catalog.mapping.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public class AdminMappingDtos {

    public record MappingItem(
            Long id,
            String name,
            String code,
            Integer sortOrder,
            boolean useYn
    ) {
    }

    public record MappingDetailResponse(
            Long ownerId,
            String ownerName,
            List<MappingItem> filters,
            List<MappingItem> tags
    ) {
    }

    public record UpdateMappingRequest(
            @NotNull
            List<Long> filterIds,
            @NotNull
            List<Long> tagIds
    ) {
    }

    public record BulkAutoSyncResponse(
            int totalCount,
            String targetType
    ) {
    }

    public record MappingJobStartResponse(
            String jobId,
            String jobType,
            String status,
            String message
    ) {
    }

    public record MappingJobStatusResponse(
            String jobId,
            String jobType,
            String status,
            String message,
            Instant startedAt,
            Instant finishedAt,
            Object result
    ) {
    }
}
