package com.example.demo.rental.domain;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import com.example.demo.trade.domain.ItemOption;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * RentalOrder
 * - 렌탈 주문
 * - seller: 아이템 소유자 / renter: 렌탈하는 사용자
 * - 영카트 스타일 주문서 (받는분, 전화번호, 주소 포함)
 */
@Entity
@Table(
        name = "rental_order",
        indexes = {
                @Index(name = "idx_rental_order_no", columnList = "order_no", unique = true),
                @Index(name = "idx_rental_order_seller_id", columnList = "seller_id"),
                @Index(name = "idx_rental_order_renter_id", columnList = "renter_id"),
                @Index(name = "idx_rental_order_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class RentalOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 주문 번호 (날짜 + 시퀀스 형식)
     */
    @Column(name = "order_no", nullable = false, length = 30, unique = true)
    private String orderNo;

    /**
     * 상품 소유자 (판매자)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Member seller;

    /**
     * 렌탈자 (구매자)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renter_id", nullable = false)
    private Member renter;

    /**
     * 렌탈 아이템
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    /**
     * 선택된 SKU 옵션 (nullable)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_option_id")
    private ItemOption itemOption;

    /**
     * 렌탈 상태
     * - 대기중 / 렌탈중 / 반납완료 / 취소
     */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "대기중";

    /**
     * 렌탈 시작일
     */
    @Column(name = "start_date")
    private LocalDate startDate;

    /**
     * 렌탈 종료일
     */
    @Column(name = "end_date")
    private LocalDate endDate;

    /**
     * 1일 렌탈가
     */
    @Column(name = "rental_price", nullable = false)
    private Integer rentalPrice;

    /**
     * 보증금
     */
    @Column(name = "deposit", nullable = false)
    private Integer deposit;

    /**
     * 받는 분 이름
     */
    @Column(name = "receiver_name", nullable = false, length = 50)
    private String receiverName;

    /**
     * 받는 분 전화번호
     */
    @Column(name = "receiver_phone", nullable = false, length = 20)
    private String receiverPhone;

    /**
     * 배송 우편번호
     */
    @Column(name = "zip_code", length = 10)
    private String zipCode;

    /**
     * 배송 도로명 주소
     */
    @Column(name = "road_address", length = 300)
    private String roadAddress;

    /**
     * 배송 상세 주소
     */
    @Column(name = "detail_address", length = 200)
    private String detailAddress;

    /**
     * 사이즈
     */
    @Column(name = "size_info", length = 30)
    private String sizeInfo;

    /**
     * 입금 금액 (렌탈가 * 일수 + 보증금)
     */
    @Column(name = "paid_amount")
    private Integer paidAmount;

    /**
     * 택배사
     */
    @Column(name = "courier", length = 50)
    private String courier;

    /**
     * 운송장 번호
     */
    @Column(name = "tracking_number", length = 50)
    private String trackingNumber;

    /**
     * 배송 진행 상태 (관리자가 별도 설정)
     * - NONE    : 배송 조회 불가 (기본값)
     * - READY   : 상품 준비
     * - SHIPPING: 상품 이동중
     * - DELIVERED: 상품 도착
     */
    @Column(name = "delivery_status", nullable = false, length = 20)
    private String deliveryStatus = "NONE";

    /**
     * 연체료
     */
    @Column(name = "overdue_fee")
    private Integer overdueFee = 0;

    /**
     * 주문 생성 일시
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
