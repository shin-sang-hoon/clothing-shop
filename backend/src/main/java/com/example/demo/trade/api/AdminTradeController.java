package com.example.demo.trade.api;

import com.example.demo.global.dto.PageResponse;
import com.example.demo.trade.application.AdminTradeService;
import com.example.demo.trade.dto.AdminTradeDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/trades")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminTradeController {

    private final AdminTradeService adminTradeService;

    /** 전체 체결 거래 조회 */
    @GetMapping("/concluded")
    public ResponseEntity<PageResponse<AdminTradeDtos.AdminConcludedTradeRow>> getConcludedTrades(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(adminTradeService.getConcludedTrades(page, size, keyword));
    }

    /** 전체 구매 입찰 조회 */
    @GetMapping("/buy-bids")
    public ResponseEntity<PageResponse<AdminTradeDtos.AdminBuyBidRow>> getBuyBids(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(adminTradeService.getBuyBids(page, size, status));
    }

    /** 전체 판매 입찰 조회 */
    @GetMapping("/sell-bids")
    public ResponseEntity<PageResponse<AdminTradeDtos.AdminSellBidRow>> getSellBids(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(adminTradeService.getSellBids(page, size, status));
    }
}
