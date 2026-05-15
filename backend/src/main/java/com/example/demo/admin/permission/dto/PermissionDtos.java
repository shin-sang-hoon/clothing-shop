package com.example.demo.admin.permission.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * PermissionDtos
 */
public class PermissionDtos {

    public record PermissionResponse(
            Long id,
            String code,
            String name,
            String description) {
    }

    public record CreatePermissionRequest(
            @NotBlank String code,
            @NotBlank String name,
            String description) {
    }

    public record UpdatePermissionRequest(
            @NotBlank String code,
            @NotBlank String name,
            String description) {
    }
}