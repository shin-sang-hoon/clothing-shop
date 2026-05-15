package com.example.demo.catalog.item.application;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemViewLog;
import com.example.demo.catalog.item.domain.ItemViewLogRepository;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * ItemViewLogService
 * - 상품 상세 조회 중복 방지(15분) + 조회 로그 저장
 */
@Service
@RequiredArgsConstructor
public class ItemViewLogService {

    private static final long DUPLICATE_WINDOW_MINUTES = 15L;

    private final ItemViewLogRepository itemViewLogRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public boolean logViewIfNotDuplicate(Item item, String memberEmail, HttpServletRequest request) {
        if (item == null || item.getId() == null) {
            return false;
        }

        String resolvedMemberEmail = resolveMemberEmail(memberEmail);
        String clientIp = extractClientIp(request);

        boolean duplicate = itemViewLogRepository.existsDuplicateWithinWindow(
                item.getId(),
                resolvedMemberEmail,
                clientIp,
                ApiDateTimeConverter.nowKst().minusMinutes(DUPLICATE_WINDOW_MINUTES)
        );
        if (duplicate) {
            return false;
        }

        ItemViewLog log = new ItemViewLog();
        log.setItem(item);
        log.setMemberEmail(resolvedMemberEmail);
        log.setIpAddress(clientIp);
        log.setUserAgent(extractUserAgent(request));

        if (resolvedMemberEmail != null) {
            Member member = memberRepository.findByEmail(resolvedMemberEmail).orElse(null);
            log.setMember(member);
        }

        itemViewLogRepository.save(log);
        return true;
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
