package com.example.demo.catalog.category.domain;

import com.example.demo.catalog.filter.domain.FilterGroup;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * CategoryTagGroupMap
 * - 카테고리와 태그그룹의 N:M 매핑 테이블
 * - 특정 카테고리에서 어떤 태그그룹(필터)을 사용하는지 정의한다.
 * - 예: 신발 카테고리 → 색상, 소재, 핏 태그그룹 사용
 */
@Entity
@Table(
        name = "category_tag_group_map",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_category_tag_group", columnNames = {"category_id", "tag_group_id"})
        },
        indexes = {
                @Index(name = "idx_ctgm_category_id", columnList = "category_id"),
                @Index(name = "idx_ctgm_tag_group_id", columnList = "tag_group_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class CategoryTagGroupMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 카테고리
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /**
     * 태그그룹
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_group_id", nullable = false)
    private FilterGroup tagGroup;

    /**
     * 정렬 순서
     * - 필터 바에서 태그그룹이 표시되는 순서
     */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /**
     * 팝업 표시 여부
     * - true: 버튼 클릭 시 팝업 다이얼로그로 선택
     * - false: 인라인 태그 버튼으로 표시
     */
    @Column(name = "popup_yn", nullable = false)
    private boolean popupYn = false;
}
