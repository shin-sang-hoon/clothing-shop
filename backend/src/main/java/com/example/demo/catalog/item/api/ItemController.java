package com.example.demo.catalog.item.api;

import com.example.demo.catalog.item.application.ItemService;
import com.example.demo.catalog.item.dto.ItemDtos;
import com.example.demo.catalog.search.application.MemberFilterActionLogService;
import com.example.demo.catalog.search.application.SearchKeywordLogService;
import com.example.demo.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ItemController
 * - 사용자 노출용 상품 API
 * - GET /api/items           상품 목록
 * - GET /api/items/{itemId}  상품 상세
 */
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final SearchKeywordLogService searchKeywordLogService;
    private final MemberFilterActionLogService memberFilterActionLogService;

    /**
     * 상품 목록 조회
     * - useYn = true 인 상품만 노출
     */
    @GetMapping
    public PageResponse<ItemDtos.ItemListResponse> getItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String categoryCode,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String brandCode,
            @RequestParam(required = false) List<Long> filterIds,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false) String itemMode,
            @AuthenticationPrincipal String email,
            HttpServletRequest request
    ) {
        searchKeywordLogService.logKeywordSearch(keyword, email, request);
        memberFilterActionLogService.logSelectedFilters(filterIds, email, request);
        return itemService.getItems(page, size, keyword, categoryCode, brand, brandCode, filterIds, tagIds, itemMode);
    }

    /**
     * 상품 상세 조회
     * - 메인이미지, 서브이미지 목록, 태그그룹별 태그, 상품 상세(HTML) 반환
     */
    @GetMapping("/{itemId}")
    public ItemDtos.ItemDetailResponse getItem(
            @PathVariable Long itemId,
            @AuthenticationPrincipal String email,
            HttpServletRequest request
    ) {
        return itemService.getItem(itemId, email, request);
    }
}
