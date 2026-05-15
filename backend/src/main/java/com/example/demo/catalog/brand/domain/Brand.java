package com.example.demo.catalog.brand.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Brand
 * - 상품 브랜드 마스터
 * - 검색창/브랜드 모달/상품 연결에서 사용한다.
 */
@Entity
@Table(
        name = "brand",
        indexes = {
                @Index(name = "idx_brand_name_ko", columnList = "name_ko"),
                @Index(name = "idx_brand_name_en", columnList = "name_en"),
                @Index(name = "idx_brand_use_yn", columnList = "use_yn"),
                @Index(name = "idx_brand_sort_order", columnList = "sort_order"),
                @Index(name = "idx_brand_exclusive_yn", columnList = "exclusive_yn")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Brand {

    /**
     * PK
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 브랜드 코드
     * 예: NIKE, ADIDAS
     */
    @Column(nullable = false, length = 50, unique = true)
    private String code;

    /**
     * 브랜드 국문명
     */
    @Column(name = "name_ko", nullable = false, length = 100)
    private String nameKo;

    /**
     * 브랜드 영문명
     */
    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;

    /**
     * 아이콘 이미지 URL
     * - 브랜드 검색 모달 목록에서 사용
     */
    @Column(name = "icon_image_url", length = 500)
    private String iconImageUrl;

    /**
     * 단독 여부
     * - 단독 브랜드 표시에 사용
     */
    @Column(name = "exclusive_yn", nullable = false)
    private boolean exclusiveYn = false;

    /**
     * 정렬 순서
     */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /**
     * 좋아요 수
     * - brand_like 기준으로 동기화한다.
     */
    @Column(name = "like_cnt", nullable = false)
    private Integer likeCnt = 0;

    /**
     * 더미 좋아요 수
     * - 초기 노출용 기본 좋아요 수 (실제 좋아요에 합산된다)
     */
    @Column(name = "dummy_like_cnt", nullable = false)
    private Integer dummyLikeCnt = 0;

    /**
     * 사용 여부
     */
    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;

    /**
     * 설명
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
