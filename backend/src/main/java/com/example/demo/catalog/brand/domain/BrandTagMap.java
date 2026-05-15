package com.example.demo.catalog.brand.domain;

import com.example.demo.catalog.filter.domain.Filter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "brand_tag_map",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_brand_tag", columnNames = {"brand_id", "tag_id"})
        },
        indexes = {
                @Index(name = "idx_btm_brand_id", columnList = "brand_id"),
                @Index(name = "idx_btm_tag_id", columnList = "tag_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BrandTagMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Filter tag;

    @Column(name = "item_count", nullable = false)
    private Integer itemCount = 0;
}
