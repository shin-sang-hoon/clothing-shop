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
@Table(name = "sell_bid",
    indexes = {
        @Index(name = "idx_sell_bid_item_id", columnList = "item_id"),
        @Index(name = "idx_sell_bid_seller_id", columnList = "seller_id"),
        @Index(name = "idx_sell_bid_status", columnList = "status"),
        @Index(name = "idx_sell_bid_item_option", columnList = "item_id, item_option_id, status")
    })
@Getter @Setter @NoArgsConstructor
public class SellBid {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_option_id")
    private ItemOption itemOption;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Member seller;

    @Column(name = "price", nullable = false)
    private Integer price;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BidStatus status = BidStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
