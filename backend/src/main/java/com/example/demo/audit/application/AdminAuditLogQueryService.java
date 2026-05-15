package com.example.demo.audit.application;

import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.audit.domain.AuditLog;
import com.example.demo.audit.domain.AuditLogRepository;
import com.example.demo.audit.domain.AuditResult;
import com.example.demo.audit.dto.AuditLogDtos;
import com.example.demo.global.dto.PageResponse;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAuditLogQueryService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public PageResponse<AuditLogDtos.AuditLogResponse> getAuditLogs(
            int page,
            int size,
            String category,
            String result,
            String keyword
    ) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );

        Page<AuditLog> auditLogPage = auditLogRepository.findAll(
                buildSpecification(category, result, keyword),
                pageable
        );

        return new PageResponse<>(
                auditLogPage.getContent().stream()
                        .map(AuditLogDtos.AuditLogResponse::from)
                        .toList(),
                auditLogPage.getNumber(),
                auditLogPage.getSize(),
                auditLogPage.getTotalElements(),
                auditLogPage.getTotalPages(),
                auditLogPage.isFirst(),
                auditLogPage.isLast()
        );
    }

    private Specification<AuditLog> buildSpecification(
            String category,
            String result,
            String keyword
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (category != null && !category.isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        root.get("category"),
                        AuditCategory.valueOf(category.trim().toUpperCase())
                ));
            }

            if (result != null && !result.isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        root.get("result"),
                        AuditResult.valueOf(result.trim().toUpperCase())
                ));
            }

            if (keyword != null && !keyword.isBlank()) {
                String likeKeyword = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("actorEmail")), likeKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("message")), likeKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("requestUri")), likeKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("httpMethod")), likeKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("eventType").as(String.class)), likeKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("category").as(String.class)), likeKeyword)
                ));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
