package com.example.demo.main.banner.application;

import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.main.banner.domain.MainBanner;
import com.example.demo.main.banner.domain.MainBannerRepository;
import com.example.demo.main.banner.dto.MainBannerDtos;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MainBannerService {

    private final MainBannerRepository mainBannerRepository;
    private final MainBannerImageStorageService mainBannerImageStorageService;
    private final RestClient restClient = RestClient.builder().build();

    @Value("${app.main-banner.seed-url:https://api.musinsa.com/api2/hm/web/v7/pans/recommend?storeCode=musinsa&gf=A}")
    private String seedUrl;

    @Transactional(readOnly = true)
    public List<MainBannerDtos.AdminBannerResponse> getAdminBanners() {
        return mainBannerRepository.findAllForAdmin().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MainBannerDtos.PublicBannerResponse> getPublicBanners() {
        return mainBannerRepository.findByUseYnTrueOrderBySortOrderAscIdAsc().stream()
                .map(this::toPublicResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MainBannerDtos.BannerFetchDebugResponse debugFetch() {
        try {
            JsonNode root = fetchRootNode();
            JsonNode dataNode = root.path("data");
            JsonNode items = findItemsArray(dataNode);

            List<String> rootKeys = new ArrayList<>();
            if (root.isObject()) {
                Iterator<String> fieldNames = root.fieldNames();
                while (fieldNames.hasNext()) {
                    rootKeys.add(fieldNames.next());
                }
            }

            List<String> dataKeys = new ArrayList<>();
            if (dataNode.isObject()) {
                Iterator<String> fieldNames = dataNode.fieldNames();
                while (fieldNames.hasNext()) {
                    dataKeys.add(fieldNames.next());
                }
            }

            List<MainBannerDtos.PreviewBannerResponse> previewItems = new ArrayList<>();
            if (items.isArray()) {
                int limit = Math.min(items.size(), 5);
                for (int index = 0; index < limit; index++) {
                    JsonNode item = items.get(index);
                    previewItems.add(new MainBannerDtos.PreviewBannerResponse(
                            readText(item, "id"),
                            item.path("info").path("title").path("text").asText(null),
                            item.path("info").path("subTitle").path("text").asText(null),
                            item.path("image").path("url").asText(null)
                    ));
                }
            }

            return new MainBannerDtos.BannerFetchDebugResponse(
                    seedUrl,
                    true,
                    root.getNodeType().name(),
                    items.isArray() ? items.size() : 0,
                    rootKeys,
                    dataKeys,
                    findItemsPath(dataNode, "data"),
                    previewItems,
                    items.isArray() ? "OK" : "data 내부에서 items 배열을 찾지 못했습니다."
            );
        } catch (Exception exception) {
            log.warn("메인 배너 디버그 조회 실패. url={}", seedUrl, exception);
            return new MainBannerDtos.BannerFetchDebugResponse(
                    seedUrl,
                    false,
                    "UNKNOWN",
                    0,
                    List.of(),
                    List.of(),
                    null,
                    List.of(),
                    exception.getMessage()
            );
        }
    }

    @Transactional
    public MainBannerDtos.ImportBannerResult importBanners() {
        List<SeedBanner> seedBanners = fetchSeedBanners();
        if (seedBanners.isEmpty()) {
            return new MainBannerDtos.ImportBannerResult(0, 0, 0);
        }

        List<MainBanner> existingBanners = mainBannerRepository.findAllForAdmin();
        Set<String> existingTitles = new HashSet<>(existingBanners.stream()
                .map(MainBanner::getTitle)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .map(String::toLowerCase)
                .toList());

        int importedCount = 0;
        int skippedCount = 0;
        int sortOrder = existingBanners.stream()
                .map(MainBanner::getSortOrder)
                .filter(value -> value != null)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        for (SeedBanner seedBanner : seedBanners) {
            String normalizedTitle = seedBanner.title().trim().toLowerCase();
            if (!existingTitles.add(normalizedTitle)) {
                skippedCount++;
                continue;
            }

            MainBanner banner = new MainBanner();
            banner.setCode(generateCode());
            applyFields(
                    banner,
                    seedBanner.title(),
                    seedBanner.subtitle(),
                    downloadSeedImage(seedBanner.imageUrl()),
                    null,
                    sortOrder,
                    true,
                    "source=" + seedUrl + ", externalId=" + seedBanner.externalId()
            );

            mainBannerRepository.save(banner);
            importedCount++;
            sortOrder++;
        }

        return new MainBannerDtos.ImportBannerResult(seedBanners.size(), importedCount, skippedCount);
    }

    @Transactional
    public MainBannerDtos.AdminBannerResponse createBanner(MainBannerDtos.CreateBannerRequest request) {
        MainBanner banner = new MainBanner();
        banner.setCode(generateCode());
        applyFields(
                banner,
                request.title(),
                request.subtitle(),
                request.imageUrl(),
                request.linkUrl(),
                request.sortOrder(),
                request.useYn(),
                request.description()
        );
        return toAdminResponse(mainBannerRepository.save(banner));
    }

    @Transactional
    public MainBannerDtos.AdminBannerResponse updateBanner(Long bannerId, MainBannerDtos.UpdateBannerRequest request) {
        MainBanner banner = findBanner(bannerId);
        applyFields(
                banner,
                request.title(),
                request.subtitle(),
                request.imageUrl(),
                request.linkUrl(),
                request.sortOrder(),
                request.useYn(),
                request.description()
        );
        return toAdminResponse(banner);
    }

    @Transactional
    public void deleteBanner(Long bannerId) {
        mainBannerRepository.delete(findBanner(bannerId));
    }

    @Transactional
    public void deleteBanners(List<Long> bannerIds) {
        for (Long bannerId : bannerIds) {
            mainBannerRepository.delete(findBanner(bannerId));
        }
    }

    private MainBanner findBanner(Long bannerId) {
        return mainBannerRepository.findById(bannerId)
                .orElseThrow(() -> new IllegalArgumentException("메인 배너를 찾을 수 없습니다. id=" + bannerId));
    }

    private void applyFields(
            MainBanner banner,
            String title,
            String subtitle,
            String imageUrl,
            String linkUrl,
            Integer sortOrder,
            Boolean useYn,
            String description
    ) {
        banner.setTitle(normalizeRequiredText(title));
        banner.setSubtitle(normalizeNullableText(subtitle));
        banner.setImageUrl(normalizeRequiredText(imageUrl));
        banner.setLinkUrl(normalizeNullableText(linkUrl));
        banner.setSortOrder(sortOrder != null ? sortOrder : 0);
        banner.setUseYn(Boolean.TRUE.equals(useYn));
        banner.setDescription(normalizeNullableText(description));
    }

    private String downloadSeedImage(String imageUrl) {
        try {
            return mainBannerImageStorageService.storeRemoteImage(imageUrl);
        } catch (IOException exception) {
            log.warn("메인 배너 이미지를 로컬 저장하지 못했습니다. imageUrl={}", imageUrl, exception);
            return imageUrl;
        }
    }

    private List<SeedBanner> fetchSeedBanners() {
        JsonNode root = fetchRootNode();
        JsonNode items = findItemsArray(root.path("data"));
        if (!items.isArray()) {
            return List.of();
        }

        List<SeedBanner> result = new ArrayList<>();
        for (JsonNode item : items) {
            String externalId = readText(item, "id");
            String title = item.path("info").path("title").path("text").asText(null);
            String subtitle = item.path("info").path("subTitle").path("text").asText(null);
            String imageUrl = item.path("image").path("url").asText(null);

            if (!StringUtils.hasText(title) || !StringUtils.hasText(imageUrl)) {
                continue;
            }

            result.add(new SeedBanner(
                    title.trim(),
                    normalizeNullableText(subtitle),
                    imageUrl.trim(),
                    normalizeNullableText(externalId)
            ));
        }

        return result;
    }

    private JsonNode findItemsArray(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isObject()) {
            JsonNode directItems = node.get("items");
            if (directItems != null && directItems.isArray()) {
                return directItems;
            }

            Iterator<JsonNode> children = node.elements();
            while (children.hasNext()) {
                JsonNode found = findItemsArray(children.next());
                if (found != null && found.isArray()) {
                    return found;
                }
            }
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                JsonNode found = findItemsArray(child);
                if (found != null && found.isArray()) {
                    return found;
                }
            }
        }

        return null;
    }

    private String findItemsPath(JsonNode node, String currentPath) {
        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isObject()) {
            JsonNode directItems = node.get("items");
            if (directItems != null && directItems.isArray()) {
                return currentPath + ".items";
            }

            Iterator<String> fieldNames = node.fieldNames();
            while (fieldNames.hasNext()) {
                String fieldName = fieldNames.next();
                String found = findItemsPath(node.get(fieldName), currentPath + "." + fieldName);
                if (found != null) {
                    return found;
                }
            }
        }

        if (node.isArray()) {
            int index = 0;
            for (JsonNode child : node) {
                String found = findItemsPath(child, currentPath + "[" + index + "]");
                if (found != null) {
                    return found;
                }
                index++;
            }
        }

        return null;
    }

    private JsonNode fetchRootNode() {
        JsonNode root = restClient.get()
                .uri(seedUrl)
                .retrieve()
                .body(JsonNode.class);

        if (root == null) {
            throw new IllegalStateException("메인 배너 API 응답이 비어 있습니다.");
        }

        return root;
    }

    private String readText(JsonNode node, String fieldName) {
        JsonNode child = node.get(fieldName);
        if (child == null || child.isNull()) {
            return null;
        }

        String value = child.asText();
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String generateCode() {
        String candidate = "MAIN_BANNER";
        int sequence = 1;

        while (mainBannerRepository.findByCode(candidate).isPresent()) {
            candidate = "MAIN_BANNER_" + sequence;
            sequence++;
        }

        return candidate;
    }

    private String normalizeRequiredText(String value) {
        String normalized = normalizeNullableText(value);
        if (!StringUtils.hasText(normalized)) {
            throw new IllegalArgumentException("필수 값이 비어 있습니다.");
        }
        return normalized;
    }

    private String normalizeNullableText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private MainBannerDtos.AdminBannerResponse toAdminResponse(MainBanner banner) {
        return new MainBannerDtos.AdminBannerResponse(
                banner.getId(),
                banner.getCode(),
                banner.getTitle(),
                banner.getSubtitle(),
                banner.getImageUrl(),
                banner.getLinkUrl(),
                banner.getSortOrder(),
                banner.isUseYn(),
                banner.getDescription(),
                ApiDateTimeConverter.toUtcString(banner.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(banner.getUpdatedAt())
        );
    }

    private MainBannerDtos.PublicBannerResponse toPublicResponse(MainBanner banner) {
        return new MainBannerDtos.PublicBannerResponse(
                banner.getId(),
                banner.getTitle(),
                banner.getSubtitle(),
                banner.getImageUrl(),
                banner.getLinkUrl(),
                banner.getSortOrder()
        );
    }

    private record SeedBanner(
            String title,
            String subtitle,
            String imageUrl,
            String externalId
    ) {
    }
}
