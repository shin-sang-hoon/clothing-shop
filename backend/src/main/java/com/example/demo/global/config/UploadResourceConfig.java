package com.example.demo.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

import java.nio.file.Path;

/**
 * UploadResourceConfig
 * - 프로젝트 루트 uploads 폴더를 /uploads/** 로 노출한다.
 */
@Configuration
public class UploadResourceConfig implements WebMvcConfigurer {

    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;

    /**
     * addResourceHandlers
     * - /uploads/** 요청을 실제 파일 시스템 uploads 폴더와 연결
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Path.of(uploadRoot).toAbsolutePath().normalize();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath.toUri().toString() + "/");
    }
}