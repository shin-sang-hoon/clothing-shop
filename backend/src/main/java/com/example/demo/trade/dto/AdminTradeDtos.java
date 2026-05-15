package com.example.demo.trade.dto;

public class AdminTradeDtos {

    public record AdminConcludedTradeRow(
            Long id,
            String tradeNo,
            Long itemId,
            String itemName,
            String brandName,
            String optionValue,
            Integer tradePrice,
            String buyerEmail,
            String buyerName,
            String sellerEmail,
            String sellerName,
            String courier,
            String trackingNumber,
            String createdAt
    ) {}

    public record AdminBuyBidRow(
            Long id,
            Long itemId,
            String itemName,
            String brandName,
            String optionValue,
            Integer price,
            String status,
            String buyerEmail,
            String buyerName,
            String createdAt
    ) {}

    public record AdminSellBidRow(
            Long id,
            Long itemId,
            String itemName,
            String brandName,
            String optionValue,
            Integer price,
            String status,
            String sellerEmail,
            String sellerName,
            String createdAt
    ) {}
}
