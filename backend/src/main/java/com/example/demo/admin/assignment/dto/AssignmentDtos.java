package com.example.demo.admin.assignment.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * AssignmentDtos
 */
public class AssignmentDtos {

    public record MemberSummary(
            Long id,
            String email,
            List<String> roles,
            List<String> permissions) {
    }

    public record SetMemberRolesRequest(
            @NotNull List<Long> roleIds) {
    }

    public record SetMemberDirectPermissionsRequest(
            @NotNull List<Long> permissionIds) {
    }
}