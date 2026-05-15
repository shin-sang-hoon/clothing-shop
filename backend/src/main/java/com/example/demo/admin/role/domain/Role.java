package com.example.demo.admin.role.domain;

import com.example.demo.admin.permission.domain.Permission;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Role
 * - Permission 묶음 템플릿(편의)
 * - 보안 판단의 기준은 "Permission"이다.
 */
@Entity
@Table(
        name = "role",
        indexes = {
                @Index(name = "idx_role_name", columnList = "name", unique = true)
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ ROLE_ 접두사 권장(일관성)
    @Column(nullable = false, length = 50, unique = true)
    private String name;

    @Column(nullable = true, length = 200)
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Role ↔ Permission (N:M)
     * - Role이 갖는 권한 묶음
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "role_permission",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"),
            uniqueConstraints = @UniqueConstraint(name = "uk_role_permission", columnNames = {"role_id", "permission_id"})
    )
    private Set<Permission> permissions = new LinkedHashSet<>();
}