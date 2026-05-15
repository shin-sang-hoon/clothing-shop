package com.example.demo.audit.domain;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * AuditLogRepository
 * - 감사 로그 저장소
 * - 관리자 조회 기능이 붙으면 조건 검색 메서드나 Querydsl 등으로 확장 가능
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {
}
