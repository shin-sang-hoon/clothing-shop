package com.example.demo.catalog.item.domain;

import com.example.demo.catalog.tag.domain.Tag;
import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "item_tag",
        indexes = {
                @Index(name = "idx_item_tag_item_id", columnList = "item_id"),
                @Index(name = "idx_item_tag_tag_id", columnList = "tag_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_item_tag", columnNames = {"item_id", "tag_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ItemTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
