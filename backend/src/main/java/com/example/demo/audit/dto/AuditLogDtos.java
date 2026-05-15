package com.example.demo.audit.dto;

import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.audit.domain.AuditLog;
import com.example.demo.audit.domain.AuditResult;

import java.time.LocalDateTime;

/**
 * AuditLogDtos
 * - 추후 관리자 페이지 응답용으로 재사용 가능한 DTO 묶음
 */
public class AuditLogDtos {

    /**
     * 관리자 조회용 요약 응답 DTO
     */
    public record AuditLogResponse(
            Long id,
            AuditCategory category,
            AuditEventType eventType,
            AuditResult result,
            Long actorId,
            String actorEmail,
            String message,
            String ipAddress,
            String requestUri,
            String httpMethod,
            LocalDateTime createdAt
    ) {
        /**
         * 엔티티 -> DTO 변환
         */
        public static AuditLogResponse from(AuditLog auditLog) {
            return new AuditLogResponse(
                    auditLog.getId(),
                    auditLog.getCategory(),
                    auditLog.getEventType(),
                    auditLog.getResult(),
                    auditLog.getActorId(),
                    auditLog.getActorEmail(),
                    auditLog.getMessage(),
                    auditLog.getIpAddress(),
                    auditLog.getRequestUri(),
                    auditLog.getHttpMethod(),
                    auditLog.getCreatedAt()
            );
        }
    }
}