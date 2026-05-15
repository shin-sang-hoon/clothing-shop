package com.example.demo.admin.permission.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * PermissionRepository
 */
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);
    boolean existsByCode(String code);
}