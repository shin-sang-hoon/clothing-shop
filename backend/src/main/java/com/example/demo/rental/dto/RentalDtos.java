package com.example.demo.rental.dto;

public class RentalDtos {

    /** 렌탈 주문 등록 요청 */
    public record CreateRentalRequest(
            Long itemId,
            Long itemOptionId,   // 선택한 SKU (nullable - 없으면 옵션 없이 처리)
            Long sellerId,
            String startDate,    // yyyy-MM-dd
            String endDate,      // yyyy-MM-dd
            String receiverName,
            String receiverPhone,
            String zipCode,
            String roadAddress,
            String detailAddress,
            String sizeInfo
    ) {}

    /** 렌탈 주문 응답 */
    public record RentalOrderResponse(
            Long rentalId,
            String orderNo,
            Long itemId,
            String itemName,
            String brandName,
            Long itemOptionId,
            String itemOptionValue,
            String sellerEmail,
            String sellerName,
            String sellerPhone,
            String renterEmail,
            String renterName,
            String renterPhone,
            String startDate,
            String endDate,
            Integer rentalPrice,
            Integer deposit,
            Integer paidAmount,
            Integer overdueFee,
            String courier,
            String trackingNumber,
            String receiverName,
            String receiverPhone,
            String zipCode,
            String roadAddress,
            String detailAddress,
            String sizeInfo,
            String itemImageUrl,
            String status,
            String createdAt
    ) {}

    /** 관리자 렌탈 목록 응답 */
    public record AdminRentalListResponse(
            Long rentalId,
            String orderNo,
            String renterEmail,
            String renterName,
            String renterPhone,
            String sellerEmail,
            String sellerName,
            String sellerPhone,
            String itemName,
            String brandName,
            String itemOptionValue,
            String receiverName,
            String receiverPhone,
            Integer paidAmount,
            Integer overdueFee,
            String courier,
            String trackingNumber,
            String startDate,
            String endDate,
            String status,
            String deliveryStatus,
            String createdAt
    ) {}

    /** 결제 검증 후 렌탈 신청 요청 */
    public record VerifyAndCreateRentalRequest(
            String paymentId,
            Long itemId,
            Long itemOptionId,
            String startDate,
            String endDate,
            String receiverName,
            String receiverPhone,
            String zipCode,
            String roadAddress,
            String detailAddress,
            String sizeInfo
    ) {}

    /** 관리자 렌탈 상태 변경 요청 */
    public record AdminUpdateStatusRequest(String status) {}

    /** 관리자 배송 등록 요청 */
    public record AdminRegisterShippingRequest(String courier, String trackingNumber) {}

    /** 관리자 배송 진행 상태 변경 요청 */
    public record AdminUpdateDeliveryStatusRequest(String deliveryStatus) {}

    /** SKU 렌탈 가용성 응답 */
    public record RentalAvailabilityResponse(
            Long optionId,
            String optionValue,
            String rentalStatus,   // ItemOptionRentalStatus
            boolean availableForDates
    ) {}
}
