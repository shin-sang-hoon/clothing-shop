package com.example.demo.delivery.api;

import com.example.demo.delivery.application.DeliveryService;
import com.example.demo.delivery.dto.DeliveryDtos;
import com.example.demo.trade.application.TradeService;
import com.example.demo.trade.dto.TradeDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final TradeService tradeService;

    /**
     * 주문번호로 배송 조회
     * GET /api/delivery?orderNo=T20260321XXXXXXXX
     */
    @GetMapping("/api/delivery")
    public ResponseEntity<DeliveryDtos.DeliveryResponse> getDelivery(
            @RequestParam String orderNo
    ) {
        try {
            DeliveryDtos.DeliveryResponse response = deliveryService.findByOrderNo(orderNo);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // "배송 조회 불가" → GlobalExceptionHandler가 400 + message 반환
            if (e.getMessage() != null && e.getMessage().contains("배송 조회가 불가")) {
                throw e;
            }
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 관리자: 입찰 체결 거래에 배송 정보 등록
     * PATCH /api/admin/trades/{tradeId}/shipping
     */
    @PatchMapping("/api/admin/trades/{tradeId}/shipping")
    @PreAuthorize("hasAuthority('PERM_ADMIN_PORTAL_ACCESS')")
    public ResponseEntity<Void> registerTradeShipping(
            @PathVariable Long tradeId,
            @RequestBody TradeDtos.AdminRegisterTradeShippingRequest req
    ) {
        tradeService.adminRegisterShipping(tradeId, req);
        return ResponseEntity.ok().build();
    }
}
