package com.example.demo.delivery.application;

import com.example.demo.delivery.dto.DeliveryDtos;
import com.example.demo.rental.domain.RentalOrder;
import com.example.demo.rental.domain.RentalOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final RentalOrderRepository rentalOrderRepository;

    @Transactional(readOnly = true)
    public DeliveryDtos.DeliveryResponse findByOrderNo(String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw new IllegalArgumentException("주문번호를 입력해주세요.");
        }

        String trimmed = orderNo.trim();

        Optional<RentalOrder> rentalOpt = rentalOrderRepository.findByOrderNo(trimmed);
        if (rentalOpt.isPresent()) {
            RentalOrder rental = rentalOpt.get();
            if ("NONE".equals(rental.getDeliveryStatus())) {
                throw new IllegalArgumentException("아직 배송 조회가 불가한 주문입니다. 관리자가 상품 준비 상태로 변경한 후 조회할 수 있습니다.");
            }
            return toRentalResponse(rental);
        }

        throw new IllegalArgumentException("해당 주문번호를 찾을 수 없습니다.");
    }

    private DeliveryDtos.DeliveryResponse toRentalResponse(RentalOrder order) {
        String status = deriveRentalStatus(order);
        String createdAt = order.getCreatedAt() != null
                ? order.getCreatedAt().format(FORMATTER)
                : null;

        return new DeliveryDtos.DeliveryResponse(
                order.getOrderNo(),
                "RENTAL",
                order.getItem() != null ? order.getItem().getName() : null,
                order.getItemOption() != null ? order.getItemOption().getOptionValue() : null,
                status,
                order.getCourier(),
                order.getTrackingNumber(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getRoadAddress(),
                order.getDetailAddress(),
                createdAt,
                order.getDeliveryStatus()
        );
    }

    private String deriveRentalStatus(RentalOrder order) {
        return switch (order.getStatus()) {
            case "렌탈중" -> "렌탈중";
            case "반납완료" -> "반납완료";
            case "취소" -> "취소";
            default -> order.getStatus();
        };
    }
}
