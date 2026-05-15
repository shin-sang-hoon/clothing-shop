package com.example.demo.main.banner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class MainBannerDtos {

    private MainBannerDtos() {
    }

    public record AdminBannerResponse(
            Long id,
            String code,
            String title,
            String subtitle,
            String imageUrl,
            String linkUrl,
            Integer sortOrder,
            boolean useYn,
            String description,
            String createdAt,
            String updatedAt
    ) {
    }

    public record PublicBannerResponse(
            Long id,
            String title,
            String subtitle,
            String imageUrl,
            String linkUrl,
            Integer sortOrder
    ) {
    }

    public record PreviewBannerResponse(
            String externalId,
            String title,
            String subtitle,
            String imageUrl
    ) {
    }

    public record BannerFetchDebugResponse(
            String requestUrl,
            boolean reachable,
            String rootNodeType,
            int itemCount,
            List<String> rootKeys,
            List<String> dataKeys,
            String detectedItemsPath,
            List<PreviewBannerResponse> previewItems,
            String message
    ) {
    }

    public record CreateBannerRequest(
            @NotBlank
            @Size(max = 200)
            String title,

            @Size(max = 300)
            String subtitle,

            @NotBlank
            @Size(max = 500)
            String imageUrl,

            @Size(max = 500)
            String linkUrl,

            @NotNull
            Integer sortOrder,

            @NotNull
            Boolean useYn,

            @Size(max = 500)
            String description
    ) {
    }

    public record UpdateBannerRequest(
            @NotBlank
            @Size(max = 200)
            String title,

            @Size(max = 300)
            String subtitle,

            @NotBlank
            @Size(max = 500)
            String imageUrl,

            @Size(max = 500)
            String linkUrl,

            @NotNull
            Integer sortOrder,

            @NotNull
            Boolean useYn,

            @Size(max = 500)
            String description
    ) {
    }

    public record ImportBannerResult(
            int totalCount,
            int importedCount,
            int skippedCount
    ) {
    }

    public record DeleteBannersRequest(
            @NotEmpty
            List<Long> bannerIds
    ) {
    }
}
