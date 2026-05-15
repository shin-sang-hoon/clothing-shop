package com.example.demo.catalog.search.application;

import com.example.demo.catalog.search.domain.MemberFilterActionLog;
import com.example.demo.catalog.search.domain.MemberFilterActionLogRepository;
import com.example.demo.catalog.search.dto.MemberFilterActionLogDtos;
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
public class AdminMemberFilterActionLogQueryService {

    private final MemberFilterActionLogRepository memberFilterActionLogRepository;

    @Transactional(readOnly = true)
    public PageResponse<MemberFilterActionLogDtos.MemberFilterActionLogResponse> getFilterActionLogs(
            int page,
            int size,
            String filterName,
            String memberEmail,
            String ipAddress
    ) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Order.desc("occurredAt"), Sort.Order.desc("id"))
        );

        Page<MemberFilterActionLog> result = memberFilterActionLogRepository.findAll(
                buildSpecification(filterName, memberEmail, ipAddress),
                pageable
        );

        return new PageResponse<>(
                result.getContent().stream()
                        .map(MemberFilterActionLogDtos.MemberFilterActionLogResponse::from)
                        .toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isFirst(),
                result.isLast()
        );
    }

    private Specification<MemberFilterActionLog> buildSpecification(
            String filterName,
            String memberEmail,
            String ipAddress
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filterName != null && !filterName.isBlank()) {
                String likeFilterName = "%" + filterName.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.join("filter").get("name")),
                        likeFilterName
                ));
            }

            if (memberEmail != null && !memberEmail.isBlank()) {
                String likeMemberEmail = "%" + memberEmail.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("memberEmail")), likeMemberEmail));
            }

            if (ipAddress != null && !ipAddress.isBlank()) {
                String likeIp = "%" + ipAddress.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("ipAddress")), likeIp));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
