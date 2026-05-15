package com.example.demo.audit.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AuditLog
 * - 관리자 화면에서 조회/분석할 이벤트 로그 엔티티
 * - 기술 로그가 아니라 업무/보안 이벤트 추적용 로그
 */
@Entity
@Table(name = "audit_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditLog {

    /**
     * PK
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 상위 카테고리
     * 예: MEMBER, ADMIN, SHOP
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private AuditCategory category;

    /**
     * 이벤트 종류
     * 예: LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 100)
    private AuditEventType eventType;

    /**
     * 처리 결과
     * 예: SUCCESS, FAIL
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20)
    private AuditResult result;

    /**
     * 행위자 ID
     * - 로그인 실패처럼 회원 식별 전이면 null 가능
     */
    @Column(name = "actor_id")
    private Long actorId;

    /**
     * 행위자 이메일
     * - 실패 시에는 입력값 저장
     * - 성공 시에는 실제 회원 이메일 저장
     */
    @Column(name = "actor_email", length = 255)
    private String actorEmail;

    /**
     * 표시용 메시지
     * - 관리자 화면에서 사유 확인 용도
     */
    @Column(name = "message", length = 500)
    private String message;

    /**
     * 요청 IP
     */
    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    /**
     * User-Agent
     */
    @Column(name = "user_agent", length = 1000)
    private String userAgent;

    /**
     * 요청 URI
     */
    @Column(name = "request_uri", length = 255)
    private String requestUri;

    /**
     * HTTP Method
     */
    @Column(name = "http_method", length = 20)
    private String httpMethod;

    /**
     * 생성일시
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 빌더 생성자
     */
    @Builder
    private AuditLog(
            AuditCategory category,
            AuditEventType eventType,
            AuditResult result,
            Long actorId,
            String actorEmail,
            String message,
            String ipAddress,
            String userAgent,
            String requestUri,
            String httpMethod,
            LocalDateTime createdAt
    ) {
        this.category = category;
        this.eventType = eventType;
        this.result = result;
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.message = message;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.requestUri = requestUri;
        this.httpMethod = httpMethod;
        this.createdAt = createdAt;
    }

    /**
     * 저장 직전 생성일시 자동 세팅
     */
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    /**
     * 정적 팩토리 메서드
     * - 로그 생성 시점의 코드 가독성 향상 목적
     */
    public static AuditLog create(
            AuditCategory category,
            AuditEventType eventType,
            AuditResult result,
            Long actorId,
            String actorEmail,
            String message,
            String ipAddress,
            String userAgent,
            String requestUri,
            String httpMethod
    ) {
        return AuditLog.builder()
                .category(category)
                .eventType(eventType)
                .result(result)
                .actorId(actorId)
                .actorEmail(actorEmail)
                .message(message)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .requestUri(requestUri)
                .httpMethod(httpMethod)
                .build();
    }
}