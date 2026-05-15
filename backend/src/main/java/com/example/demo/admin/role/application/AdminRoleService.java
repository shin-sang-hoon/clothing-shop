package com.example.demo.admin.role.application;

import com.example.demo.admin.permission.domain.Permission;
import com.example.demo.admin.permission.domain.PermissionRepository;
import com.example.demo.admin.role.domain.Role;
import com.example.demo.admin.role.domain.RoleRepository;
import com.example.demo.admin.role.dto.RoleDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * AdminRoleService
 * - Role CRUD + RolePermission 설정
 *
 * 주의:
 * - Role은 템플릿이고, 인가 기준은 Permission이다.
 */
@Service
@RequiredArgsConstructor
public class AdminRoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<RoleDtos.RoleResponse> list() {
        return roleRepository.findAll().stream()
                .map(r -> new RoleDtos.RoleResponse(
                        r.getId(),
                        r.getName(),
                        r.getDescription(),
                        r.getPermissions().stream().map(Permission::getCode).toList()))
                .toList();
    }

    @Transactional
    public RoleDtos.RoleResponse create(RoleDtos.CreateRoleRequest req) {
        String name = normalizeRole(req.name());
        if (roleRepository.existsByName(name)) {
            throw new IllegalArgumentException("Role already exists: " + name);
        }

        Role role = new Role();
        role.setName(name);
        role.setDescription(req.description());

        Role saved = roleRepository.save(role);
        return new RoleDtos.RoleResponse(saved.getId(), saved.getName(), saved.getDescription(), List.of());
    }

    @Transactional
    public RoleDtos.RoleResponse update(Long id, RoleDtos.UpdateRoleRequest req) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + id));

        String name = normalizeRole(req.name());

        roleRepository.findByName(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Role name already exists: " + name);
            }
        });

        role.setName(name);
        role.setDescription(req.description());

        return new RoleDtos.RoleResponse(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.getPermissions().stream().map(Permission::getCode).toList());
    }

    @Transactional
    public void delete(Long id) {
        roleRepository.deleteById(id);
    }

    @Transactional
    public RoleDtos.RoleResponse setRolePermissions(Long roleId, RoleDtos.UpdateRolePermissionsRequest req) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleId));

        List<Permission> perms = permissionRepository.findAllById(req.permissionIds());
        if (perms.size() != req.permissionIds().size()) {
            throw new IllegalArgumentException("Some permissions not found");
        }

        role.getPermissions().clear();
        role.getPermissions().addAll(perms);

        return new RoleDtos.RoleResponse(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.getPermissions().stream().map(Permission::getCode).toList());
    }

    private static String normalizeRole(String name) {
        String n = name.trim().toUpperCase();
        if (!n.startsWith("ROLE_"))
            n = "ROLE_" + n;
        return n;
    }
}