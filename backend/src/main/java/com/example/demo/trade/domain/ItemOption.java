package com.example.demo.trade.domain;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "item_option",
        indexes = {
                @Index(name = "idx_item_option_item_id", columnList = "item_id"),
    @Index(name = "idx_item_option_source_tag_id", columnList = "source_tag_id"),
                @Index(name = "idx_item_option_sort_order", columnList = "sort_order")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ItemOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_tag_id")
    private Filter sourceTag;

    @Column(name = "option_value", nullable = false, length = 100)
    private String optionValue;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "rental_status", length = 20)
    private ItemOptionRentalStatus rentalStatus = ItemOptionRentalStatus.AVAILABLE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
