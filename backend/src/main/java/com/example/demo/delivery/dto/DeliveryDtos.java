package com.example.demo.delivery.dto;

public class DeliveryDtos {

    /**
     * 배송조회 응답
     * - type: RENTAL(렌탈) / TRADE(입찰거래)
     * - status: 현재 주문/거래 상태
     * - courier, trackingNumber: 배송 등록 전이면 null
     */
    public record DeliveryResponse(
            String orderNo,
            String type,
            String itemName,
            String optionValue,
            String status,
            String courier,
            String trackingNumber,
            String receiverName,
            String receiverPhone,
            String roadAddress,
            String detailAddress,
            String createdAt,
            String deliveryStatus
    ) {
    }
}
