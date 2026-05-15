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

@Service
public class FilterImageStorageService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;

    public String saveFilterImage(String filterCode, String imageUrl) {
        if (filterCode == null || filterCode.isBlank() || imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        try {
            Path filterDir = Path.of(uploadRoot, "filter").toAbsolutePath().normalize();
            Files.createDirectories(filterDir);

            String extension = resolveExtension(imageUrl);
            String safeFileName = sanitizeFileName(filterCode) + extension;
            Path targetPath = filterDir.resolve(safeFileName);

            if (!Files.exists(targetPath)) {
                downloadImage(imageUrl, targetPath);
            }

            return "/uploads/filter/" + safeFileName;
        } catch (Exception e) {
            return null;
        }
    }

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
            throw new IOException("image download failed status=" + response.statusCode());
        }

        Files.copy(response.body(), targetPath, StandardCopyOption.REPLACE_EXISTING);
    }

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

    private String sanitizeFileName(String rawValue) {
        return rawValue.trim().replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
