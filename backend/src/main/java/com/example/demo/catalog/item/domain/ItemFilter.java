package com.example.demo.catalog.item.domain;

import com.example.demo.catalog.filter.domain.Filter;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "item_filter",
        indexes = {
                @Index(name = "idx_item_filter_item_id", columnList = "item_id"),
                @Index(name = "idx_item_filter_tag_id", columnList = "tag_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_item_filter", columnNames = {"item_id", "tag_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ItemFilter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Filter tag;
}
