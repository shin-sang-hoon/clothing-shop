package com.example.demo.admin.permission.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Permission
 * - 모든 기능 접근 권한의 단위(SSOT)
 * - 예: PERM_ADMIN_PORTAL_ACCESS, PERM_ROLE_CREATE ...
 */
@Entity
@Table(
        name = "permission",
        indexes = {
                @Index(name = "idx_permission_code", columnList = "code", unique = true)
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ 유니크 코드: PERM_ 접두사 강제 권장
    @Column(nullable = false, length = 80, unique = true)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = true, length = 200)
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}