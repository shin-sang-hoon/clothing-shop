package com.example.demo.catalog.category.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Category
 * - 상품 카테고리 마스터
 * - 무신사 등 외부 카탈로그의 계층형 카테고리를 저장한다.
 * - genderType 대신 depth + parent 구조로 관리한다.
 */
@Entity
@Table(
        name = "category",
        indexes = {
                @Index(name = "idx_category_name", columnList = "name"),
                @Index(name = "idx_category_parent_id", columnList = "parent_id"),
                @Index(name = "idx_category_depth", columnList = "depth"),
                @Index(name = "idx_category_use_yn", columnList = "use_yn"),
                @Index(name = "idx_category_sort_order", columnList = "sort_order")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Category {

    /**
     * PK
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 카테고리명
     * 예: 뷰티, 스킨케어, 마스크팩
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 외부 카테고리 코드
     * 예: 104, 104001
     */
    @Column(nullable = false, length = 50, unique = true)
    private String code;

    /**
     * 부모 카테고리
     * - 최상위 카테고리는 null
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    /**
     * 카테고리 depth
     * - 최상위: 1
     * - 하위: 2, 3 ...
     */
    @Column(name = "depth", nullable = false)
    private Integer depth = 1;

    /**
     * 정렬 순서
     */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /**
     * 사용 여부
     * - 삭제 대신 비활성 처리용
     */
    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;

    /**
     * 카테고리 이미지 URL
     * - 무신사 thumbnail 또는 대표 이미지
     */
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /**
     * 설명
     * - 현재는 group title 정도를 담아둘 수 있다.
     */
    @Column(length = 500)
    private String description;

    /**
     * 생성 일시
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();

    /**
     * 수정 일시
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = ApiDateTimeConverter.nowKst();

    /**
     * 수정 시각 자동 반영
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ApiDateTimeConverter.nowKst();
    }
}