package com.example.demo.catalog.mapping.api;

import com.example.demo.catalog.mapping.application.ShopMappingService;
import com.example.demo.catalog.mapping.dto.ShopMappingDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class ShopMappingController {

    private final ShopMappingService shopMappingService;

    @GetMapping("/{categoryCode}/display-mapping")
    public ShopMappingDtos.CategoryDisplayMappingResponse getCategoryDisplayMapping(
            @PathVariable String categoryCode
    ) {
        return shopMappingService.getCategoryDisplayMapping(categoryCode);
    }
}
