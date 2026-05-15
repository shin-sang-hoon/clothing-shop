package com.example.demo.main.banner.application;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
public class MainBannerImageStorageService {

    private static final Map<String, String> CONTENT_TYPE_EXTENSION_MAP = Map.of(
            MediaType.IMAGE_JPEG_VALUE, ".jpg",
            MediaType.IMAGE_PNG_VALUE, ".png",
            MediaType.IMAGE_GIF_VALUE, ".gif",
            "image/webp", ".webp"
    );

    private final RestClient restClient = RestClient.builder().build();

    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;

    public String storeUpload(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "banner";
        String extension = detectExtension(originalFilename, file.getContentType());
        return storeBytes(file.getBytes(), originalFilename, extension);
    }

    public String storeRemoteImage(String imageUrl) throws IOException {
        byte[] imageBytes = restClient.get()
                .uri(imageUrl)
                .retrieve()
                .body(byte[].class);

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IOException("메인 배너 이미지를 내려받지 못했습니다. url=" + imageUrl);
        }

        String originalFilename = extractFileName(imageUrl);
        String extension = detectExtension(originalFilename, null);
        return storeBytes(imageBytes, originalFilename, extension);
    }

    private String storeBytes(byte[] bytes, String sourceName, String extension) throws IOException {
        Path dir = Path.of(uploadRoot, "mainBanner").toAbsolutePath().normalize();
        Files.createDirectories(dir);

        String fileName = buildHashedFileName(sourceName, extension);
        Path target = dir.resolve(fileName);
        Files.write(target, bytes);

        return "/uploads/mainBanner/" + fileName;
    }

    private String buildHashedFileName(String sourceName, String extension) {
        String seed = sourceName + ":" + Instant.now().toEpochMilli() + ":" + UUID.randomUUID();
        return sha256(seed) + extension;
    }

    private String sha256(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 해시 생성에 실패했습니다.", exception);
        }
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

    private String extractFileName(String imageUrl) {
        try {
            String path = URI.create(imageUrl).getPath();
            if (!StringUtils.hasText(path)) {
                return "banner";
            }

            Path filePath = Path.of(path);
            return filePath.getFileName() != null ? filePath.getFileName().toString() : "banner";
        } catch (Exception exception) {
            return "banner";
        }
    }
}
