package com.example.demo.catalog.brand.domain;

import com.example.demo.catalog.filter.domain.Filter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "brand_filter_map",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_brand_filter_map", columnNames = {"brand_id", "filter_id"})
        },
        indexes = {
                @Index(name = "idx_brand_filter_map_brand_id", columnList = "brand_id"),
                @Index(name = "idx_brand_filter_map_filter_id", columnList = "filter_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BrandFilterMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filter_id", nullable = false)
    private Filter filter;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;
}
