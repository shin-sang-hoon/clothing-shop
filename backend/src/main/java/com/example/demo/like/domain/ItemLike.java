package com.example.demo.like.domain;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ItemLike
 * - 사용자 상품 좋아요
 * - member_id + item_id 유니크 제약
 */
@Entity
@Table(
        name = "item_like",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_item_like_member_item",
                columnNames = {"member_id", "item_id"}
        ),
        indexes = {
                @Index(name = "idx_item_like_member_id", columnList = "member_id"),
                @Index(name = "idx_item_like_item_id", columnList = "item_id")
        }
)
@Getter
@NoArgsConstructor
public class ItemLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();

    public ItemLike(Member member, Item item) {
        this.member = member;
        this.item = item;
    }
}
