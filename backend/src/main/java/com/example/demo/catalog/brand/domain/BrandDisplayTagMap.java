package com.example.demo.catalog.brand.domain;

import com.example.demo.catalog.tag.domain.Tag;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "brand_display_tag_map",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_brand_display_tag_map", columnNames = {"brand_id", "tag_id"})
        },
        indexes = {
                @Index(name = "idx_brand_display_tag_map_brand_id", columnList = "brand_id"),
                @Index(name = "idx_brand_display_tag_map_tag_id", columnList = "tag_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BrandDisplayTagMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;
}
