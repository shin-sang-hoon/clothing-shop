package com.example.demo.trade.api;

import com.example.demo.trade.application.TradeService;
import com.example.demo.trade.dto.TradeDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/items/{itemId}/options")
@RequiredArgsConstructor
public class AdminItemOptionController {

    private final TradeService tradeService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<TradeDtos.ItemOptionResponse>> getOptions(@PathVariable Long itemId) {
        return ResponseEntity.ok(tradeService.getItemOptions(itemId));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<TradeDtos.ItemOptionResponse> createOption(
            @PathVariable Long itemId,
            @Valid @RequestBody TradeDtos.CreateItemOptionRequest req) {
        return ResponseEntity.ok(
                tradeService.addItemOption(
                        itemId,
                        req.optionValue(),
                        req.sortOrder(),
                        req.quantity(),
                        req.sourceTagId()
                )
        );
    }

    @DeleteMapping("/{optionId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteOption(
            @PathVariable Long itemId,
            @PathVariable Long optionId) {
        tradeService.deleteItemOption(optionId);
        return ResponseEntity.noContent().build();
    }
}
