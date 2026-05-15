package com.example.demo.catalog.search.application;

import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.search.domain.MemberFilterActionLog;
import com.example.demo.catalog.search.domain.MemberFilterActionLogRepository;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MemberFilterActionLogService {

    private static final long DUPLICATE_WINDOW_MINUTES = 15L;

    private final MemberFilterActionLogRepository memberFilterActionLogRepository;
    private final FilterRepository filterRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public void logSelectedFilters(List<Long> filterIds, String memberEmail, HttpServletRequest request) {
        if (filterIds == null || filterIds.isEmpty()) {
            return;
        }

        String resolvedMemberEmail = resolveMemberEmail(memberEmail);
        String clientIp = extractClientIp(request);

        List<Filter> filters = filterRepository.findAllById(filterIds).stream()
                .filter(Filter::isUseYn)
                .toList();
        if (filters.isEmpty()) {
            return;
        }

        Member member = null;
        if (resolvedMemberEmail != null) {
            member = memberRepository.findByEmail(resolvedMemberEmail).orElse(null);
        }

        for (Filter filter : filters) {
            boolean duplicate = memberFilterActionLogRepository.existsDuplicateWithinWindow(
                    filter.getId(),
                    resolvedMemberEmail,
                    clientIp,
                    ApiDateTimeConverter.nowKst().minusMinutes(DUPLICATE_WINDOW_MINUTES)
            );
            if (duplicate) {
                continue;
            }

            MemberFilterActionLog log = new MemberFilterActionLog();
            log.setFilter(filter);
            log.setMemberEmail(resolvedMemberEmail);
            log.setIpAddress(clientIp);
            log.setUserAgent(extractUserAgent(request));
            log.setMember(member);

            memberFilterActionLogRepository.save(log);
        }
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
}
