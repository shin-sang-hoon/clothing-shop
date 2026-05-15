package com.example.demo.admin.permission.application;

import com.example.demo.admin.permission.domain.Permission;
import com.example.demo.admin.permission.domain.PermissionRepository;
import com.example.demo.admin.permission.dto.PermissionDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * AdminPermissionService
 * - Permission 마스터 CRUD
 */
@Service
@RequiredArgsConstructor
public class AdminPermissionService {

    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<PermissionDtos.PermissionResponse> list() {
        return permissionRepository.findAll().stream()
                .map(p -> new PermissionDtos.PermissionResponse(p.getId(), p.getCode(), p.getName(),
                        p.getDescription()))
                .toList();
    }

    @Transactional
    public PermissionDtos.PermissionResponse create(PermissionDtos.CreatePermissionRequest req) {
        String code = normalizePerm(req.code());
        if (permissionRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Permission already exists: " + code);
        }

        Permission p = new Permission();
        p.setCode(code);
        p.setName(req.name().trim());
        p.setDescription(req.description());

        Permission saved = permissionRepository.save(p);
        return new PermissionDtos.PermissionResponse(saved.getId(), saved.getCode(), saved.getName(),
                saved.getDescription());
    }

    @Transactional
    public PermissionDtos.PermissionResponse update(Long id, PermissionDtos.UpdatePermissionRequest req) {
        Permission p = permissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permission not found: " + id));

        String code = normalizePerm(req.code());

        permissionRepository.findByCode(code).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Permission code already exists: " + code);
            }
        });

        p.setCode(code);
        p.setName(req.name().trim());
        p.setDescription(req.description());

        return new PermissionDtos.PermissionResponse(p.getId(), p.getCode(), p.getName(), p.getDescription());
    }

    @Transactional
    public void delete(Long id) {
        permissionRepository.deleteById(id);
    }

    private static String normalizePerm(String code) {
        String c = code.trim().toUpperCase();
        if (!c.startsWith("PERM_"))
            c = "PERM_" + c;
        return c;
    }
}