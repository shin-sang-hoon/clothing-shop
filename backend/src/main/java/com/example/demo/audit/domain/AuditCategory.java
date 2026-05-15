package com.example.demo.audit.domain;

/**
 * AuditCategory
 * - 로그의 상위 분류
 * - 추후 서비스 확장을 고려해 enum으로 관리
 */
public enum AuditCategory {
    MEMBER,
    ADMIN,
    SHOP,
    CHAT,
    SYSTEM
}