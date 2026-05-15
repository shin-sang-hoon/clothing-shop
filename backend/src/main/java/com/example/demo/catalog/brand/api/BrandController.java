package com.example.demo.catalog.brand.api;

import com.example.demo.catalog.brand.application.BrandService;
import com.example.demo.catalog.brand.dto.BrandDtos;
import com.example.demo.global.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * BrandController
 * - 사용자 노출용 브랜드 목록 API
 * - 인증 불필요 (anyRequest().permitAll() 적용)
 */
@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;

    /**
     * 사용자용 브랜드 목록 조회
     * - useYn=true 브랜드만 반환
     */
    @GetMapping("/{id}")
    public BrandDtos.BrandListResponse getPublicBrandById(@PathVariable Long id) {
        return brandService.getPublicBrandById(id);
    }

    @GetMapping
    public PageResponse<BrandDtos.BrandListResponse> getPublicBrands(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String initialConsonant,
            @RequestParam(defaultValue = "default") String sort
    ) {
        return brandService.getPublicBrands(page, size, keyword, initialConsonant, sort);
    }
}
