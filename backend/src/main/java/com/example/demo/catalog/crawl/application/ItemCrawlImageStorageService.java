package com.example.demo.catalog.crawl.application;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class ItemCrawlImageStorageService {

    private static final Pattern IMG_SRC_PATTERN = Pattern.compile("(?i)<img[^>]+src=[\"']([^\"']+)[\"']");
    private static final Map<String, String> CONTENT_TYPE_EXTENSION_MAP = Map.of(
            MediaType.IMAGE_JPEG_VALUE, ".jpg",
            MediaType.IMAGE_PNG_VALUE, ".png",
            MediaType.IMAGE_GIF_VALUE, ".gif",
            "image/webp", ".webp"
    );
    private static final String THUMBNAIL_FOLDER = "thumbnail";
    private static final String CONTENT_FOLDER = "content";

    private final RestClient restClient = RestClient.builder().build();

    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;

    public String storeThumbnailImage(Long itemId, String imageUrl) throws IOException {
        return storeRemoteImage(itemId, THUMBNAIL_FOLDER, imageUrl);
    }

    public String storeContentImage(Long itemId, String imageUrl) throws IOException {
        return storeRemoteImage(itemId, CONTENT_FOLDER, imageUrl);
    }

    public String replaceContentImageUrls(Long itemId, String html) throws IOException {
        if (!StringUtils.hasText(html)) {
            return html;
        }

        Matcher matcher = IMG_SRC_PATTERN.matcher(html);
        StringBuffer buffer = new StringBuffer();
        Map<String, String> replacedUrlCache = new HashMap<>();

        while (matcher.find()) {
            String originalUrl = matcher.group(1);
            if (replacedUrlCache.containsKey(originalUrl)) {
                String cachedUrl = replacedUrlCache.get(originalUrl);
                matcher.appendReplacement(
                        buffer,
                        Matcher.quoteReplacement(matcher.group(0).replace(originalUrl, cachedUrl))
                );
                continue;
            }

            String storedUrl;
            try {
                String stored = storeContentImage(itemId, originalUrl);
                storedUrl = stored != null ? stored : originalUrl;
            } catch (Exception e) {
                String reason = e.getMessage();
                if (reason != null && reason.length() > 120) {
                    reason = reason.substring(0, 120) + "...";
                }
                log.debug("content image skipped. itemId={}, url={}, reason={}", itemId, originalUrl, reason);
                storedUrl = originalUrl;
            }

            replacedUrlCache.put(originalUrl, storedUrl);
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(matcher.group(0).replace(originalUrl, storedUrl)));
        }

        matcher.appendTail(buffer);
        return buffer.toString();
    }

    private String storeRemoteImage(Long itemId, String folderName, String imageUrl) throws IOException {
        if (itemId == null || !StringUtils.hasText(imageUrl)) {
            return null;
        }

        String resolvedUrl = normalizeImageUrl(imageUrl);
        if (resolvedUrl == null) {
            return null;
        }

        String originalFilename = extractFileName(resolvedUrl);
        String extension = detectExtension(originalFilename, null);
        Path dir = Path.of(uploadRoot, "item", String.valueOf(itemId), folderName).toAbsolutePath().normalize();
        Files.createDirectories(dir);

        String fileName = buildOriginalFileName(originalFilename, extension);
        Path target = dir.resolve(fileName);
        if (Files.exists(target) && Files.size(target) > 0) {
            return "/uploads/item/" + itemId + "/" + folderName + "/" + fileName;
        }

        byte[] imageBytes = restClient.get()
                .uri(resolvedUrl)
                .retrieve()
                .body(byte[].class);

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IOException("상품 이미지를 내려받지 못했습니다. url=" + resolvedUrl);
        }

        Files.write(target, imageBytes);
        return "/uploads/item/" + itemId + "/" + folderName + "/" + fileName;
    }

    private String normalizeImageUrl(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return imageUrl;
        }

        if (imageUrl.startsWith("//")) {
            return "https:" + imageUrl;
        }
        if (imageUrl.startsWith("/")) {
            return "https://image.msscdn.net" + imageUrl;
        }
        if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            return null;
        }
        return imageUrl;
    }

    private String buildOriginalFileName(String originalFilename, String extension) {
        String baseName = removeExtension(originalFilename);
        if (!StringUtils.hasText(baseName)) {
            baseName = "item-image";
        }

        // 경로/특수문자 제거 (파일명 안전화)
        String normalizedBaseName = baseName.replaceAll("[^A-Za-z0-9._-]", "_");
        if (!StringUtils.hasText(normalizedBaseName)) {
            normalizedBaseName = "item-image";
        }

        return normalizedBaseName + extension;
    }

    private String detectExtension(String fileName, String contentType) {
        String extension = extractExtension(fileName);
        if (StringUtils.hasText(extension)) {
            return extension;
        }

        if (StringUtils.hasText(contentType)) {
            return CONTENT_TYPE_EXTENSION_MAP.getOrDefault(contentType, ".jpg");
        }

        return ".jpg";
    }

    private String extractExtension(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return "";
        }

        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dotIndex).toLowerCase();
    }

    private String removeExtension(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return "";
        }
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex <= 0) {
            return fileName;
        }
        return fileName.substring(0, dotIndex);
    }

    private String extractFileName(String imageUrl) {
        try {
            String path = URI.create(imageUrl).getPath();
            if (!StringUtils.hasText(path)) {
                return "item-image";
            }

            Path filePath = Path.of(path);
            return filePath.getFileName() != null ? filePath.getFileName().toString() : "item-image";
        } catch (Exception exception) {
            return "item-image";
        }
    }
}
