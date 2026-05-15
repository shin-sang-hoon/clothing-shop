package com.example.demo.like.domain;

import com.example.demo.catalog.brand.domain.Brand;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * BrandLike
 * - 사용자 브랜드 좋아요
 * - 유저 1 : 브랜드 N (member_id + brand_id 유니크)
 */
@Entity
@Table(
        name = "brand_like",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_brand_like_member_brand",
                columnNames = {"member_id", "brand_id"}
        ),
        indexes = {
                @Index(name = "idx_brand_like_member_id", columnList = "member_id"),
                @Index(name = "idx_brand_like_brand_id", columnList = "brand_id")
        }
)
@Getter
@NoArgsConstructor
public class BrandLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();

    public BrandLike(Member member, Brand brand) {
        this.member = member;
        this.brand = brand;
    }
}
