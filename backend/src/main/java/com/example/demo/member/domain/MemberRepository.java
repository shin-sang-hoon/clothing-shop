package com.example.demo.member.domain;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * MemberRepository
 */
public interface MemberRepository extends JpaRepository<Member, Long>, JpaSpecificationExecutor<Member> {

    Optional<Member> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Member> findByNameAndPhoneNumber(String name, String phoneNumber);

    @EntityGraph(attributePaths = {
            "roles",
            "roles.permissions",
            "directPermissions"
    })
    Optional<Member> findWithAuthGraphById(Long id);

    @EntityGraph(attributePaths = {
            "roles",
            "roles.permissions",
            "directPermissions"
    })
    Optional<Member> findWithAuthGraphByEmail(String email);

    /**
     * 관리자 회원 상세/수정용
     */
    @EntityGraph(attributePaths = {"roles"})
    Optional<Member> findWithRolesById(Long id);

    /**
     * 페이지 조회 후 roles 포함 재조회용
     * - pageable + to-many fetch join 문제 회피 목적
     */
    @EntityGraph(attributePaths = {"roles"})
    List<Member> findByIdIn(List<Long> ids);

    /**
     * 특정 역할을 가진 첫 번째 회원 조회 (렌탈 sellerId 미지정 시 기본 관리자 사용 목적)
     */
    @Query("SELECT m FROM Member m JOIN m.roles r WHERE r.name = :roleName ORDER BY m.id ASC")
    List<Member> findByRoleName(@Param("roleName") String roleName);
}