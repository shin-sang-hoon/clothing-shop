package com.example.demo.dev;

import com.example.demo.admin.permission.domain.Permission;
import com.example.demo.admin.permission.domain.PermissionRepository;
import com.example.demo.admin.role.domain.Role;
import com.example.demo.admin.role.domain.RoleRepository;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import com.example.demo.member.domain.MemberStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * DataInitializer
 * - 개발 편의용 기본 Permission / Role / 관리자 계정 시드
 * <p>
 * 중요:
 * - 현재 프로젝트의 인가 기준은 "Role 이름"이 아니라 "Permission code" 이다.
 * - 따라서 관리자 접근 및 각 관리자 기능 권한을 반드시 PERM_* 코드로 시드해야 한다.
 * - 프론트/백엔드 모두 PERM_ADMIN_PORTAL_ACCESS 를 관리자 포털 진입 기준으로 사용 중이다.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        /**
         * 관리자 포털 접근 권한
         */
        Permission adminPortalAccess = ensurePerm(
                "PERM_ADMIN_PORTAL_ACCESS",
                "관리자 포털 접근",
                "관리자 페이지 진입 권한"
        );

        /**
         * 회원 관리 관련 권한
         * - 실제 컨트롤러 / 서비스에서 사용하는 코드 기준으로 생성
         */
        Permission memberRead = ensurePerm(
                "PERM_MEMBER_READ",
                "회원 조회",
                "회원 목록/상세 조회 권한"
        );

        Permission memberSetRoles = ensurePerm(
                "PERM_MEMBER_SET_ROLES",
                "회원 역할 변경",
                "회원의 role 변경 권한"
        );

        Permission memberSetPermissions = ensurePerm(
                "PERM_MEMBER_SET_PERMISSIONS",
                "회원 개별 권한 변경",
                "회원의 direct permission 변경 권한"
        );

        /**
         * 권한 관리 관련 권한
         */
        Permission permissionRead = ensurePerm(
                "PERM_PERMISSION_READ",
                "권한 조회",
                "권한 목록 조회 권한"
        );

        Permission permissionCreate = ensurePerm(
                "PERM_PERMISSION_CREATE",
                "권한 생성",
                "권한 생성 권한"
        );

        Permission permissionUpdate = ensurePerm(
                "PERM_PERMISSION_UPDATE",
                "권한 수정",
                "권한 수정 권한"
        );

        Permission permissionDelete = ensurePerm(
                "PERM_PERMISSION_DELETE",
                "권한 삭제",
                "권한 삭제 권한"
        );

        /**
         * 역할 관리 관련 권한
         */
        Permission roleRead = ensurePerm(
                "PERM_ROLE_READ",
                "역할 조회",
                "역할 목록 조회 권한"
        );

        Permission roleCreate = ensurePerm(
                "PERM_ROLE_CREATE",
                "역할 생성",
                "역할 생성 권한"
        );

        Permission roleUpdate = ensurePerm(
                "PERM_ROLE_UPDATE",
                "역할 수정",
                "역할 수정 권한"
        );

        Permission roleDelete = ensurePerm(
                "PERM_ROLE_DELETE",
                "역할 삭제",
                "역할 삭제 권한"
        );

        Permission roleSetPermissions = ensurePerm(
                "PERM_ROLE_SET_PERMISSIONS",
                "역할 권한 연결",
                "역할에 permission 연결 권한"
        );

        /**
         * 기본 역할 생성
         */
        Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN").orElseGet(() -> {
            Role role = new Role();
            role.setName("ROLE_SUPER_ADMIN");
            role.setDescription("최고 관리자");
            return roleRepository.save(role);
        });

        Role userRole = roleRepository.findByName("ROLE_USER").orElseGet(() -> {
            Role role = new Role();
            role.setName("ROLE_USER");
            role.setDescription("일반 사용자");
            return roleRepository.save(role);
        });

        /**
         * 최고 관리자 역할에 관리자용 모든 권한 부여
         * - DB 재초기화 후에도 일관된 상태가 되도록 clear 후 addAll 처리
         */
        superAdminRole.getPermissions().clear();
        superAdminRole.getPermissions().addAll(List.of(
                adminPortalAccess,
                memberRead,
                memberSetRoles,
                memberSetPermissions,
                permissionRead,
                permissionCreate,
                permissionUpdate,
                permissionDelete,
                roleRead,
                roleCreate,
                roleUpdate,
                roleDelete,
                roleSetPermissions
        ));

        /**
         * 일반 사용자 역할은 기본적으로 관리자 권한 없음
         */
        userRole.getPermissions().clear();

        roleRepository.save(superAdminRole);
        roleRepository.save(userRole);

        /**
         * 기본 관리자 계정 생성
         */
        Member admin = memberRepository.findByEmail("admin@test.com").orElseGet(() -> {
            Member m = new Member();
            m.setName("관리자");
            m.setEmail("admin@test.com");
            m.setPasswordHash(passwordEncoder.encode("1234"));
            m.setPhoneNumber("01011111111");
            m.setEmailVerified(true);
            m.setEmailVerifiedAt(ApiDateTimeConverter.nowKst());
            m.setStatus(MemberStatus.NORMAL);
            m.setPoint(0);
            m.setMemo("기본 관리자 계정");
            return memberRepository.save(m);
        });

        /**
         * 관리자 계정에 최고 관리자 role 연결
         */
        admin.getRoles().clear();
        admin.getRoles().add(superAdminRole);

        /**
         * direct permission은 비워둔다.
         * - 기본 관리자는 role 기반 권한만으로 동작하게 두는 편이 구조상 명확하다.
         * - member_permission 테이블은 필요 시 개별 권한 부여에만 사용
         */
        admin.getDirectPermissions().clear();

        memberRepository.save(admin);
    }

    /**
     * permission 코드가 없으면 생성하고, 있으면 기존 것 재사용
     */
    private Permission ensurePerm(String code, String name, String desc) {
        return permissionRepository.findByCode(code).orElseGet(() -> {
            Permission p = new Permission();
            p.setCode(code);
            p.setName(name);
            p.setDescription(desc);
            return permissionRepository.save(p);
        });
    }
}