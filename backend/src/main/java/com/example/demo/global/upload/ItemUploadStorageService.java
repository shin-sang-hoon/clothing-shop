package com.example.demo.global.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ItemUploadStorageService {

    private static final String ITEM_PREFIX = "/uploads/item/";
    private static final String THUMBNAIL_FOLDER = "thumbnail";
    private static final String CONTENT_FOLDER = "content";
    private static final Pattern IMG_SRC_PATTERN = Pattern.compile("(?i)<img[^>]+src=[\"']([^\"']+)[\"']");

    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;

    public String moveToThumbnailFolder(Long itemId, String imageUrl) {
        return moveToFolder(itemId, imageUrl, THUMBNAIL_FOLDER);
    }

    public String moveToContentFolder(Long itemId, String imageUrl) {
        return moveToFolder(itemId, imageUrl, CONTENT_FOLDER);
    }

    public String replaceContentImageUrls(Long itemId, String html) {
        if (!StringUtils.hasText(html)) {
            return html;
        }

        Matcher matcher = IMG_SRC_PATTERN.matcher(html);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            String originalUrl = matcher.group(1);
            String movedUrl = moveToContentFolder(itemId, originalUrl);
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(matcher.group(0).replace(originalUrl, movedUrl)));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }

    private String moveToFolder(Long itemId, String imageUrl, String folderName) {
        if (itemId == null || imageUrl == null || imageUrl.isBlank()) {
            return imageUrl;
        }
        if (!imageUrl.startsWith(ITEM_PREFIX)) {
            return imageUrl;
        }

        String normalizedUrl = imageUrl.replace("\\", "/");
        String finalPrefix = ITEM_PREFIX + itemId + "/" + folderName + "/";
        if (normalizedUrl.startsWith(finalPrefix)) {
            return normalizedUrl;
        }

        // 이미 해당 상품의 다른 폴더에 저장된 이미지(구 한글 폴더명 등)는 이동 없이 그대로 반환
        String itemPathPrefix = ITEM_PREFIX + itemId + "/";
        if (normalizedUrl.startsWith(itemPathPrefix)) {
            return normalizedUrl;
        }

        String relativePath = normalizedUrl.substring(ITEM_PREFIX.length());
        Path sourcePath = Path.of(uploadRoot, "item").resolve(relativePath).toAbsolutePath().normalize();
        if (!Files.exists(sourcePath) || Files.isDirectory(sourcePath)) {
            return normalizedUrl;
        }

        String fileName = sourcePath.getFileName() != null ? sourcePath.getFileName().toString() : null;
        if (fileName == null || fileName.isBlank()) {
            return normalizedUrl;
        }

        Path targetDirectory = Path.of(uploadRoot, "item", String.valueOf(itemId), folderName)
                .toAbsolutePath()
                .normalize();
        Path targetPath = targetDirectory.resolve(fileName);

        try {
            Files.createDirectories(targetDirectory);
            Files.move(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            return finalPrefix + fileName;
        } catch (IOException exception) {
            throw new IllegalStateException("상품 이미지 이동에 실패했습니다. imageUrl=" + imageUrl, exception);
        }
    }
}
