package com.example.demo.admin.role.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * RoleDtos
 */
public class RoleDtos {

        public record RoleResponse(
                        Long id,
                        String name,
                        String description,
                        List<String> permissionCodes) {
        }

        public record CreateRoleRequest(
                        @NotBlank String name,
                        String description) {
        }

        public record UpdateRoleRequest(
                        @NotBlank String name,
                        String description) {
        }

        public record UpdateRolePermissionsRequest(
                        @NotNull List<Long> permissionIds) {
        }
}