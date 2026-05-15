package com.example.demo.catalog.item.domain;

import com.example.demo.catalog.brand.domain.Brand;
import com.example.demo.catalog.category.domain.Category;
import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Item
 * - 상품 마스터
 * - brand, category 를 FK 로 물고, 이미지/태그는 별도 테이블로 연결한다.
 */
@Entity
@Table(
        name = "item",
        indexes = {
                @Index(name = "idx_item_item_no", columnList = "item_no", unique = true),
                @Index(name = "idx_item_brand_id", columnList = "brand_id"),
                @Index(name = "idx_item_category_id", columnList = "category_id"),
                @Index(name = "idx_item_use_yn", columnList = "use_yn"),
                @Index(name = "idx_item_sort_order", columnList = "sort_order"),
                @Index(name = "idx_item_view_cnt", columnList = "view_cnt")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Item {

    /**
     * PK
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 상품 번호
     * - ID를 9자리 0-패딩으로 표현
     * - 예: 000000001
     * - 저장 후 서비스에서 세팅
     */
    @Column(name = "item_no", nullable = false, length = 20, unique = true)
    private String itemNo;

    /**
     * 상품명
     */
    @Column(nullable = false, length = 200)
    private String name;

    /**
     * 브랜드
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    /**
     * 카테고리
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    /**
     * 상위 카테고리 종류
     * - 예: 신발, 상의, 아우터
     */
    @Column(name = "kind", length = 50)
    private String kind;

    /**
     * 성별
     * - Men / Women / Unisex
     */
    /**
     * 정가 (Retail Price)
     */
    @Column(name = "retail_price")
    private Integer retailPrice;

    /**
     * 1일 렌탈 가격 (Rental Price)
     */
    @Column(name = "rental_price")
    private Integer rentalPrice;

    /**
     * 거래 유형
     * - AUCTION: 입찰 전용 (사용자 간 거래)
     * - RENTAL: 렌탈 전용 (관리자 대여)
     * - BOTH: 입찰 + 렌탈 모두
     */
    @Column(name = "item_mode", length = 10)
    private String itemMode = "AUCTION";

    /**
     * 상품 상태
     * - 판매중 / 품절 / 숨김
     */
    @Column(name = "status", length = 20)
    private String status = "판매중";

    /**
     * 상품 설명 (리치 텍스트 에디터 HTML)
     * - 관리자 상품 등록 시 에디터에서 작성한 내용
     * - 사용자 상품 상세의 "상품 상세" 영역에 그대로 노출된다.
     */
    @Column(name = "detail_content", columnDefinition = "LONGTEXT")
    private String detailContent;

    /**
     * 정렬 순서
     */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /**
     * 좋아요 수
     * - item_like 테이블 COUNT 기준으로 갱신
     */
    @Column(name = "like_cnt", nullable = false)
    private Integer likeCnt = 0;

    /**
     * 조회수
     * - 상품 상세 조회 시 1씩 증가
     */
    @Column(name = "view_cnt", nullable = false, columnDefinition = "INT NOT NULL DEFAULT 0")
    private Integer viewCnt = 0;

    /**
     * 사용 여부
     * - false 이면 사용자에게 노출하지 않는다.
     */
    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;

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
