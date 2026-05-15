package com.example.demo.catalog.category.domain;

import com.example.demo.catalog.tag.domain.Tag;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "category_display_tag_map",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_category_display_tag_map", columnNames = {"category_id", "tag_id"})
        },
        indexes = {
                @Index(name = "idx_category_display_tag_map_category_id", columnList = "category_id"),
                @Index(name = "idx_category_display_tag_map_tag_id", columnList = "tag_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class CategoryDisplayTagMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;
}
