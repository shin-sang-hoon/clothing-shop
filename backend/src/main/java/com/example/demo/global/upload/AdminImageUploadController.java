package com.example.demo.global.upload;

import com.example.demo.main.banner.application.MainBannerImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

/**
 * AdminImageUploadController
 * - 관리자 이미지 파일 업로드 API
 * - 브랜드 / 카테고리 아이콘 이미지를 로컬 저장소에 저장하고 경로를 반환한다.
 */
@RestController
@RequestMapping("/api/admin/upload")
@RequiredArgsConstructor
public class AdminImageUploadController {

    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;
    private final MainBannerImageStorageService mainBannerImageStorageService;

    /**
     * 브랜드 아이콘 이미지 업로드
     */
    @PostMapping("/brand-image")
    public Map<String, String> uploadBrandImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return uploadImage(file, "brand");
    }

    /**
     * 카테고리 이미지 업로드
     */
    @PostMapping("/category-image")
    public Map<String, String> uploadCategoryImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return uploadImage(file, "category");
    }

    /**
     * 상품 이미지 업로드
     */
    @PostMapping("/item-image")
    public Map<String, String> uploadItemImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return uploadImage(file, "item");
    }

    @PostMapping("/main-banner-image")
    public Map<String, String> uploadMainBannerImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return Map.of("url", mainBannerImageStorageService.storeUpload(file));
    }

    /**
     * 공통 업로드 처리
     * - UUID 기반 파일명으로 저장해 중복을 방지한다.
     * - 저장 경로: {uploadRoot}/{folder}/{uuid}.{ext}
     * - 반환 경로: /uploads/{folder}/{uuid}.{ext}
     */
    private Map<String, String> uploadImage(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename()
                : "image";

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        String fileName = UUID.randomUUID() + extension;
        Path dir = Path.of(uploadRoot, folder).toAbsolutePath().normalize();
        Files.createDirectories(dir);

        Path target = dir.resolve(fileName);
        Files.write(target, file.getBytes());

        return Map.of("url", "/uploads/" + folder + "/" + fileName);
    }
}
