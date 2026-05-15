package com.example.demo.catalog.search.application;

import com.example.demo.catalog.search.domain.SearchKeywordLog;
import com.example.demo.catalog.search.domain.SearchKeywordLogRepository;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * SearchKeywordLogService
 * - 검색어 로그 저장 서비스
 */
@Service
@RequiredArgsConstructor
public class SearchKeywordLogService {

    private static final long DUPLICATE_WINDOW_MINUTES = 15L;

    private final SearchKeywordLogRepository searchKeywordLogRepository;
    private final MemberRepository memberRepository;

    /**
     * 검색 키워드 로그 저장
     * - keyword가 비어 있으면 저장하지 않는다.
     */
    @Transactional
    public void logKeywordSearch(String keyword, String memberEmail, HttpServletRequest request) {
        String normalizedKeyword = normalizeKeyword(keyword);
        if (normalizedKeyword == null) {
            return;
        }

        String resolvedMemberEmail = resolveMemberEmail(memberEmail);
        String clientIp = extractClientIp(request);

        if (searchKeywordLogRepository.existsDuplicateWithinWindow(
                normalizedKeyword,
                resolvedMemberEmail,
                clientIp,
                ApiDateTimeConverter.nowKst().minusMinutes(DUPLICATE_WINDOW_MINUTES)
        )) {
            return;
        }

        SearchKeywordLog log = new SearchKeywordLog();
        log.setKeyword(keyword.trim());
        log.setNormalizedKeyword(normalizedKeyword);
        log.setIpAddress(clientIp);
        log.setUserAgent(extractUserAgent(request));
        log.setMemberEmail(resolvedMemberEmail);

        if (resolvedMemberEmail != null) {
            Member member = memberRepository.findByEmail(resolvedMemberEmail).orElse(null);
            log.setMember(member);
        }

        searchKeywordLogRepository.save(log);
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String normalized = keyword.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] ips = forwardedFor.split(",");
            if (ips.length > 0) {
                return ips[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            return null;
        }
        return userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent;
    }

    private String resolveMemberEmail(String memberEmail) {
        if (memberEmail != null && !memberEmail.isBlank()) {
            return memberEmail.trim().toLowerCase(Locale.ROOT);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }

        String principal = authentication.getName().trim().toLowerCase(Locale.ROOT);
        if ("anonymoususer".equals(principal)) {
            return null;
        }

        return principal;
    }
}
