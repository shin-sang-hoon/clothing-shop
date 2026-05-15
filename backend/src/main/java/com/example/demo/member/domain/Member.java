package com.example.demo.member.domain;

import com.example.demo.admin.permission.domain.Permission;
import com.example.demo.admin.role.domain.Role;
import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Member
 * - 사용자
 * <p>
 * 로그인 정책:
 * - 로그인 키는 email 사용
 * <p>
 * 회원 찾기 정책:
 * - 이메일 찾기는 name + phoneNumber 기준
 */
@Entity
@Table(
        name = "member",
        indexes = {
                @Index(name = "idx_member_email", columnList = "email", unique = true),
                @Index(name = "idx_member_phone_number", columnList = "phone_number")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 회원 이름
     */
    @Column(nullable = false, length = 50)
    private String name;

    /**
     * 닉네임 (채팅에서 표시)
     */
    @Column(length = 30)
    private String nickname;

    /**
     * 로그인 이메일
     */
    @Column(nullable = false, length = 190, unique = true)
    private String email;

    /**
     * 전화번호
     * - 숫자만 저장
     */
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    /**
     * BCrypt 해시 비밀번호
     */
    @Column(nullable = false, length = 200)
    private String passwordHash;

    /**
     * 이메일 인증 여부
     */
    @Column(nullable = false)
    private boolean emailVerified = false;

    /**
     * 이메일 인증 완료 시각
     */
    @Column
    private LocalDateTime emailVerifiedAt;

    /**
     * 회원 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemberStatus status = MemberStatus.NORMAL;

    /**
     * 포인트
     */
    @Column(nullable = false)
    private Integer point = 0;

    /**
     * 우편번호
     */
    @Column(name = "zip_code", length = 10)
    private String zipCode;

    /**
     * 도로명 주소
     */
    @Column(name = "road_address", length = 300)
    private String roadAddress;

    /**
     * 상세 주소
     */
    @Column(name = "detail_address", length = 200)
    private String detailAddress;

    /**
     * 관리자 메모
     */
    @Column(length = 1000)
    private String memo;

    /**
     * 최종 로그인 시각
     */
    @Column
    private LocalDateTime lastLoginAt;

    /**
     * 생성 시각
     * - 서버 기본 타임존에 의존하지 않도록 한국 시간 기준으로 생성한다.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "member_role",
            joinColumns = @JoinColumn(name = "member_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"),
            uniqueConstraints = @UniqueConstraint(
                    name = "uk_member_role",
                    columnNames = {"member_id", "role_id"}
            )
    )
    private Set<Role> roles = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "member_permission",
            joinColumns = @JoinColumn(name = "member_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"),
            uniqueConstraints = @UniqueConstraint(
                    name = "uk_member_permission",
                    columnNames = {"member_id", "permission_id"}
            )
    )
    private Set<Permission> directPermissions = new LinkedHashSet<>();
}