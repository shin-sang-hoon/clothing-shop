package com.example.demo.catalog.search.application;

import com.example.demo.catalog.search.domain.SearchKeywordLog;
import com.example.demo.catalog.search.domain.SearchKeywordLogRepository;
import com.example.demo.catalog.search.dto.SearchKeywordLogDtos;
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
public class AdminSearchKeywordLogQueryService {

    private final SearchKeywordLogRepository searchKeywordLogRepository;

    @Transactional(readOnly = true)
    public PageResponse<SearchKeywordLogDtos.SearchKeywordLogResponse> getSearchLogs(
            int page,
            int size,
            String keyword,
            String memberEmail,
            String ipAddress
    ) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Order.desc("searchedAt"), Sort.Order.desc("id"))
        );

        Page<SearchKeywordLog> searchLogPage = searchKeywordLogRepository.findAll(
                buildSpecification(keyword, memberEmail, ipAddress),
                pageable
        );

        return new PageResponse<>(
                searchLogPage.getContent().stream()
                        .map(SearchKeywordLogDtos.SearchKeywordLogResponse::from)
                        .toList(),
                searchLogPage.getNumber(),
                searchLogPage.getSize(),
                searchLogPage.getTotalElements(),
                searchLogPage.getTotalPages(),
                searchLogPage.isFirst(),
                searchLogPage.isLast()
        );
    }

    private Specification<SearchKeywordLog> buildSpecification(
            String keyword,
            String memberEmail,
            String ipAddress
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String likeKeyword = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("keyword")), likeKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("normalizedKeyword")), likeKeyword)
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
