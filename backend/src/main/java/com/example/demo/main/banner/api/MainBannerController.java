package com.example.demo.main.banner.api;

import com.example.demo.main.banner.application.MainBannerService;
import com.example.demo.main.banner.dto.MainBannerDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/main-banners")
@RequiredArgsConstructor
public class MainBannerController {

    private final MainBannerService mainBannerService;

    @GetMapping
    public List<MainBannerDtos.PublicBannerResponse> getMainBanners() {
        return mainBannerService.getPublicBanners();
    }
}
