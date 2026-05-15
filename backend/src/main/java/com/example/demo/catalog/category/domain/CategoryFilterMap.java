package com.example.demo.catalog.category.domain;

import com.example.demo.catalog.filter.domain.Filter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "category_filter_map",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_category_filter_map", columnNames = {"category_id", "filter_id"})
        },
        indexes = {
                @Index(name = "idx_category_filter_map_category_id", columnList = "category_id"),
                @Index(name = "idx_category_filter_map_filter_id", columnList = "filter_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class CategoryFilterMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filter_id", nullable = false)
    private Filter filter;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;
}
