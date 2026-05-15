package com.example.demo.trade.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class TradeDtos {

    public record ItemOptionResponse(
            Long id,
            String optionValue,
            Integer quantity,
            Integer sortOrder,
            Long sourceTagId
    ) {
    }

    public record CreateItemOptionRequest(
            @NotNull String optionValue,
            Integer quantity,
            Integer sortOrder,
            Long sourceTagId
    ) {
    }

    public record PlaceBuyBidRequest(
            @NotNull Long itemId,
            Long itemOptionId,
            @NotNull @Min(1) Integer price
    ) {
    }

    public record PlaceSellBidRequest(
            @NotNull Long itemId,
            Long itemOptionId,
            @NotNull @Min(1) Integer price
    ) {
    }

    public record BuyBidResponse(
            Long id,
            Long itemId,
            String itemName,
            String itemImageUrl,
            String optionValue,
            Integer price,
            String status,
            Integer paymentAmount,
            String createdAt
    ) {
    }

    public record SellBidResponse(
            Long id,
            Long itemId,
            String itemName,
            String itemImageUrl,
            String optionValue,
            Integer price,
            String status,
            String createdAt
    ) {
    }

    public record ConcludedTradeResponse(
            Long id,
            String tradeNo,
            Long itemId,
            String itemName,
            String itemImageUrl,
            String optionValue,
            Integer tradePrice,
            String buyerEmail,
            String sellerEmail,
            String courier,
            String trackingNumber,
            String createdAt
    ) {
    }

    public record AdminRegisterTradeShippingRequest(
            @NotNull String courier,
            @NotNull String trackingNumber,
            String receiverName,
            String receiverPhone,
            String zipCode,
            String roadAddress,
            String detailAddress
    ) {
    }

    public record PriceHistoryPoint(String date, Integer price) {
    }

    public record TradeDrawerResponse(
            List<ItemOptionResponse> options,
            Integer instantBuyPrice,
            Integer instantSellPrice,
            List<PriceHistoryPoint> priceHistory
    ) {
    }

    public record PlaceBidResult(String result, Long tradeId, String message) {
    }

    public record PaymentVerifyRequest(
            @NotNull String paymentId,
            @NotNull Long itemId,
            Long itemOptionId,
            @NotNull @Min(1) Integer price
    ) {
    }
}
