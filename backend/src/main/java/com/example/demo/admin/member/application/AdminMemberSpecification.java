package com.example.demo.admin.member.application;

import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

/**
 * AdminMemberSpecification
 * - 관리자 회원 목록 검색/필터 조건 Specification
 */
public final class AdminMemberSpecification {

    private static final String DB_ROLE_ADMIN = "ROLE_SUPER_ADMIN";
    private static final String DB_ROLE_USER = "ROLE_USER";

    private AdminMemberSpecification() {
    }

    /**
     * 회원 목록 검색 조건 생성
     *
     * @param searchType  검색 타입(email, name, phoneNumber)
     * @param keyword     검색어
     * @param role        역할(USER, ADMIN)
     * @param statusLabel 상태(정상, 차단, 탈퇴)
     */
    public static Specification<Member> search(
            String searchType,
            String keyword,
            String role,
            String statusLabel
    ) {
        return Specification.where(keywordSpec(searchType, keyword))
                .and(roleSpec(role))
                .and(statusSpec(statusLabel));
    }

    /**
     * 키워드 검색 조건
     */
    private static Specification<Member> keywordSpec(String searchType, String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return null;
            }

            String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";

            if ("email".equals(searchType)) {
                return cb.like(cb.lower(root.get("email")), normalizedKeyword);
            }

            if ("name".equals(searchType)) {
                return cb.like(cb.lower(root.get("name")), normalizedKeyword);
            }

            if ("phoneNumber".equals(searchType)) {
                return cb.like(cb.lower(root.get("phoneNumber")), normalizedKeyword);
            }

            return null;
        };
    }

    /**
     * 역할 필터
     * - 프론트 ADMIN / USER 값을 실제 DB Role 이름으로 변환
     */
    private static Specification<Member> roleSpec(String role) {
        return (root, query, cb) -> {
            if (role == null || role.isBlank()) {
                return null;
            }

            query.distinct(true);

            Join<Object, Object> roleJoin = root.join("roles", JoinType.LEFT);

            String dbRoleName = switch (role) {
                case "ADMIN" -> DB_ROLE_ADMIN;
                case "USER" -> DB_ROLE_USER;
                default -> null;
            };

            if (dbRoleName == null) {
                return null;
            }

            return cb.equal(roleJoin.get("name"), dbRoleName);
        };
    }

    /**
     * 상태 필터
     */
    private static Specification<Member> statusSpec(String statusLabel) {
        return (root, query, cb) -> {
            if (statusLabel == null || statusLabel.isBlank()) {
                return null;
            }

            MemberStatus status = MemberStatus.fromLabel(statusLabel);
            return cb.equal(root.get("status"), status);
        };
    }
}