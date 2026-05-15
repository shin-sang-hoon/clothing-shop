package com.example.demo.trade.domain;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "concluded_trade",
    indexes = {
        @Index(name = "idx_concluded_item_id", columnList = "item_id"),
        @Index(name = "idx_concluded_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_concluded_seller_id", columnList = "seller_id"),
        @Index(name = "idx_concluded_item_option", columnList = "item_id, item_option_id"),
        @Index(name = "idx_concluded_created_at", columnList = "created_at"),
        @Index(name = "idx_concluded_trade_no", columnList = "trade_no", unique = true)
    })
@Getter @Setter @NoArgsConstructor
public class ConcludedTrade {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trade_no", unique = true, length = 30)
    private String tradeNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_option_id")
    private ItemOption itemOption;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Member buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Member seller;

    @Column(name = "trade_price", nullable = false)
    private Integer tradePrice;

    /** 배송 정보 (관리자가 등록) */
    @Column(name = "courier", length = 50)
    private String courier;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "receiver_name", length = 50)
    private String receiverName;

    @Column(name = "receiver_phone", length = 20)
    private String receiverPhone;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(name = "road_address", length = 200)
    private String roadAddress;

    @Column(name = "detail_address", length = 200)
    private String detailAddress;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
