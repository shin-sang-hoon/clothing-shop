package com.example.demo.review.domain;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "review",
    indexes = {
        @Index(name = "idx_review_item_id", columnList = "item_id"),
        @Index(name = "idx_review_member_id", columnList = "member_id")
    })
@Getter @Setter @NoArgsConstructor
public class Review {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private Integer rating;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(length = 20)
    private String size;

    private Integer height;

    private Integer weight;

    @Column(length = 500)
    private String photoUrl;

    @Column(nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
