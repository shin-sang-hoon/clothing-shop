package com.example.demo.catalog.filter.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "filter",
        indexes = {
                @Index(name = "idx_filter_name", columnList = "name"),
                @Index(name = "idx_filter_code", columnList = "code", unique = true),
                @Index(name = "idx_filter_group_id", columnList = "filter_group_id"),
                @Index(name = "idx_filter_use_yn", columnList = "use_yn"),
                @Index(name = "idx_filter_sort_order", columnList = "sort_order")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Filter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filter_group_id", nullable = false)
    private FilterGroup filterGroup;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100, unique = true)
    private String code;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;

    @Column(name = "color_hex", length = 20)
    private String colorHex;

    @Column(name = "icon_image_url", length = 500)
    private String iconImageUrl;

    @Column(length = 500)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = ApiDateTimeConverter.nowKst();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ApiDateTimeConverter.nowKst();
    }
}
