package com.example.demo.catalog.category.domain;

import com.example.demo.catalog.filter.domain.Filter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "category_tag_map",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_category_tag", columnNames = {"category_id", "tag_id"})
        },
        indexes = {
                @Index(name = "idx_ctm_category_id", columnList = "category_id"),
                @Index(name = "idx_ctm_tag_id", columnList = "tag_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class CategoryTagMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Filter tag;

    @Column(name = "item_count", nullable = false)
    private Integer itemCount = 0;
}
