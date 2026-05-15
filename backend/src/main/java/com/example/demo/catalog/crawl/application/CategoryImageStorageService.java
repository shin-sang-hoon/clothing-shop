package com.example.demo.catalog.crawl.application;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLConnection;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * CategoryImageStorageService
 * - 카테고리 이미지를 프로젝트 루트 uploads/category 에 저장한다.
 *
 * 저장 규칙:
 * - 파일명: {categoryCode}.{ext}
 * - DB 저장 경로: /uploads/category/{categoryCode}.{ext}
 */
@Service
public class CategoryImageStorageService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    /**
     * 업로드 루트 폴더
     * - 프로젝트 루트 기준 상대경로
     */
    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;

    /**
     * saveCategoryImage
     * - 카테고리 이미지를 내려받아 저장하고 DB 저장용 URL 경로를 반환한다.
     */
    public String saveCategoryImage(String categoryCode, String imageUrl) {
        if (categoryCode == null || categoryCode.isBlank() || imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        try {
            Path categoryDir = Path.of(uploadRoot, "category").toAbsolutePath().normalize();
            Files.createDirectories(categoryDir);

            String extension = resolveExtension(imageUrl);
            String safeFileName = sanitizeFileName(categoryCode) + extension;
            Path targetPath = categoryDir.resolve(safeFileName);

            /**
             * 이미 파일이 있으면 재다운로드하지 않고 그대로 사용
             */
            if (!Files.exists(targetPath)) {
                downloadImage(imageUrl, targetPath);
            }

            return "/uploads/category/" + safeFileName;
        } catch (Exception e) {
            /**
             * 이미지 저장 실패 시 카테고리 저장 자체를 막지 않기 위해 null 반환
             */
            return null;
        }
    }

    /**
     * downloadImage
     * - 이미지 다운로드
     */
    private void downloadImage(String imageUrl, Path targetPath) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(imageUrl))
                .header("User-Agent", "Mozilla/5.0")
                .GET()
                .build();

        HttpResponse<InputStream> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofInputStream()
        );

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("이미지 다운로드 실패 status=" + response.statusCode());
        }

        Files.copy(response.body(), targetPath, StandardCopyOption.REPLACE_EXISTING);
    }

    /**
     * resolveExtension
     * - URL / MIME 타입 추정 기반 확장자 판별
     */
    private String resolveExtension(String imageUrl) {
        String lower = imageUrl.toLowerCase();

        if (lower.contains(".png")) {
            return ".png";
        }
        if (lower.contains(".webp")) {
            return ".webp";
        }
        if (lower.contains(".gif")) {
            return ".gif";
        }
        if (lower.contains(".jpeg")) {
            return ".jpeg";
        }
        if (lower.contains(".jpg")) {
            return ".jpg";
        }

        String guessed = URLConnection.guessContentTypeFromName(imageUrl);
        if ("image/png".equalsIgnoreCase(guessed)) {
            return ".png";
        }
        if ("image/webp".equalsIgnoreCase(guessed)) {
            return ".webp";
        }
        if ("image/gif".equalsIgnoreCase(guessed)) {
            return ".gif";
        }
        if ("image/jpeg".equalsIgnoreCase(guessed)) {
            return ".jpg";
        }

        return ".png";
    }

    /**
     * sanitizeFileName
     * - 파일명 안전 문자만 유지
     */
    private String sanitizeFileName(String rawValue) {
        return rawValue.trim().replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
