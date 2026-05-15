package com.example.demo.trade.api;

import com.example.demo.global.dto.PageResponse;
import com.example.demo.trade.application.TradeService;
import com.example.demo.trade.dto.TradeDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trade")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    // ─── Public endpoints ────────────────────────────────────────────────────────

    @GetMapping("/items/{itemId}/options")
    public ResponseEntity<List<TradeDtos.ItemOptionResponse>> getItemOptions(@PathVariable Long itemId) {
        return ResponseEntity.ok(tradeService.getItemOptions(itemId));
    }

    @GetMapping("/items/{itemId}/drawer")
    public ResponseEntity<TradeDtos.TradeDrawerResponse> getTradeDrawer(
            @PathVariable Long itemId,
            @RequestParam(required = false) Long optionId) {
        return ResponseEntity.ok(tradeService.getTradeDrawer(itemId, optionId));
    }

    @GetMapping("/items/{itemId}/concluded")
    public ResponseEntity<PageResponse<TradeDtos.ConcludedTradeResponse>> getConcludedTrades(
            @PathVariable Long itemId,
            @RequestParam(required = false) Long optionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tradeService.getConcludedTrades(itemId, optionId, page, size));
    }

    @GetMapping("/items/{itemId}/sell-bids")
    public ResponseEntity<PageResponse<TradeDtos.SellBidResponse>> getPendingSellBids(
            @PathVariable Long itemId,
            @RequestParam(required = false) Long optionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tradeService.getPendingSellBids(itemId, optionId, page, size));
    }

    @GetMapping("/items/{itemId}/buy-bids")
    public ResponseEntity<PageResponse<TradeDtos.BuyBidResponse>> getPendingBuyBids(
            @PathVariable Long itemId,
            @RequestParam(required = false) Long optionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tradeService.getPendingBuyBids(itemId, optionId, page, size));
    }

    @GetMapping("/items/{itemId}/price-history")
    public ResponseEntity<List<TradeDtos.PriceHistoryPoint>> getPriceHistory(
            @PathVariable Long itemId,
            @RequestParam(required = false) Long optionId,
            @RequestParam(defaultValue = "3개월") String range) {
        return ResponseEntity.ok(tradeService.getPriceHistory(itemId, optionId, range));
    }

    // ─── Authenticated endpoints ─────────────────────────────────────────────────

    @PostMapping("/buy-bids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TradeDtos.PlaceBidResult> placeBuyBid(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody TradeDtos.PlaceBuyBidRequest req) {
        return ResponseEntity.ok(tradeService.placeBuyBid(
                req.itemId(), req.itemOptionId(), req.price(), email));
    }

    @PostMapping("/buy-bids/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TradeDtos.PlaceBidResult> verifyAndPlaceBuyBid(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody TradeDtos.PaymentVerifyRequest req) {
        return ResponseEntity.ok(tradeService.verifyAndPlaceBuyBid(
                req.paymentId(), req.itemId(), req.itemOptionId(), req.price(), email));
    }

    @PostMapping("/sell-bids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TradeDtos.PlaceBidResult> placeSellBid(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody TradeDtos.PlaceSellBidRequest req) {
        return ResponseEntity.ok(tradeService.placeSellBid(
                req.itemId(), req.itemOptionId(), req.price(), email));
    }

    @DeleteMapping("/buy-bids/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> cancelBuyBid(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        tradeService.cancelBuyBid(id, email);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sell-bids/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> cancelSellBid(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        tradeService.cancelSellBid(id, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my/buy-bids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<TradeDtos.BuyBidResponse>> getMyBuyBids(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tradeService.getMyBuyBids(email, page, size));
    }

    @GetMapping("/my/sell-bids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<TradeDtos.SellBidResponse>> getMySellBids(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tradeService.getMySellBids(email, page, size));
    }

    @GetMapping("/my/concluded/buy")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<TradeDtos.ConcludedTradeResponse>> getMyConcludedBuyTrades(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tradeService.getMyConcludedBuyTrades(email, page, size));
    }

    @GetMapping("/my/concluded/sell")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<TradeDtos.ConcludedTradeResponse>> getMyConcludedSellTrades(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tradeService.getMyConcludedSellTrades(email, page, size));
    }
}
