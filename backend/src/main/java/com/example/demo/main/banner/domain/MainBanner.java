package com.example.demo.main.banner.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "main_banner",
        indexes = {
                @Index(name = "idx_main_banner_sort_order", columnList = "sort_order"),
                @Index(name = "idx_main_banner_use_yn", columnList = "use_yn")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class MainBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String code;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 300)
    private String subtitle;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "link_url", length = 500)
    private String linkUrl;

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
