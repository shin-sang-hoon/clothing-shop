package com.example.demo.catalog.filter.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "filter_group",
        indexes = {
                @Index(name = "idx_filter_group_name", columnList = "name"),
                @Index(name = "idx_filter_group_code", columnList = "code", unique = true),
                @Index(name = "idx_filter_group_use_yn", columnList = "use_yn"),
                @Index(name = "idx_filter_group_sort_order", columnList = "sort_order")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class FilterGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "multi_select_yn", nullable = false)
    private boolean multiSelectYn = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "group_role", nullable = false, length = 20, columnDefinition = "varchar(20) default 'ALL'")
    private FilterGroupRole role = FilterGroupRole.ALL;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn = true;

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
