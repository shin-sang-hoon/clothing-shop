package com.example.demo.catalog.item.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * ItemImage
 * - 상품 이미지
 * - MAIN  : 대표이미지 1장
 * - SUB   : 서브이미지 최대 5장 (sort_order 0~4)
 */
@Entity
@Table(
        name = "item_image",
        indexes = {
                @Index(name = "idx_item_image_item_id", columnList = "item_id"),
                @Index(name = "idx_item_image_type", columnList = "image_type")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ItemImage {

    /**
     * PK
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 연결 상품
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    /**
     * 이미지 종류 (MAIN / SUB)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "image_type", nullable = false, length = 10)
    private ItemImageType imageType;

    /**
     * 이미지 URL
     */
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    /**
     * 정렬 순서
     * - MAIN 은 항상 0
     * - SUB  는 0~4 (등록 순서)
     */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
