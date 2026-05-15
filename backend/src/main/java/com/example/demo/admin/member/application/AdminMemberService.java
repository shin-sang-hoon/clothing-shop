package com.example.demo.admin.member.application;

import com.example.demo.admin.member.dto.AdminMemberDtos;
import com.example.demo.admin.role.domain.Role;
import com.example.demo.admin.role.domain.RoleRepository;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import com.example.demo.member.domain.MemberStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * AdminMemberService
 * - 회원 목록 조회
 * - 회원 역할(roleIds)로 교체(set)하는 기존 기능 유지
 * - 관리자 회원 목록/상세/등록/수정 추가
 */
@Service
@RequiredArgsConstructor
public class AdminMemberService {

    private static final String DB_ROLE_ADMIN = "ROLE_SUPER_ADMIN";
    private static final String DB_ROLE_USER = "ROLE_USER";

    private final MemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 기존 역할 변경용 목록
     * - 기존 API 호환 유지
     */
    @Transactional(readOnly = true)
    public List<AdminMemberDtos.MemberResponse> listMembers() {
        return memberRepository.findAll().stream()
                .map(m -> new AdminMemberDtos.MemberResponse(
                        m.getId(),
                        m.getEmail(),
                        m.getRoles().stream().map(Role::getName).toList()
                ))
                .toList();
    }

    /**
     * 기존 역할 변경 기능
     * - 기존 API 호환 유지
     */
    @Transactional
    public AdminMemberDtos.MemberResponse updateMemberRoles(Long memberId, AdminMemberDtos.UpdateMemberRolesRequest req) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        List<Role> roles = roleRepository.findAllById(req.roleIds());
        if (roles.size() != req.roleIds().size()) {
            throw new IllegalArgumentException("Some roles not found");
        }

        member.getRoles().clear();
        member.getRoles().addAll(roles);

        return new AdminMemberDtos.MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getRoles().stream().map(Role::getName).toList()
        );
    }

    /**
     * 관리자 회원 목록 조회
     * - pageable + 검색조건 적용
     * - 공통 PageResponse<T> 사용
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminMemberDtos.MemberListResponse> listMembersForAdmin(
            int page,
            int size,
            String searchType,
            String keyword,
            String role,
            String status
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Member> memberPage = memberRepository.findAll(
                AdminMemberSpecification.search(searchType, keyword, role, status),
                pageable
        );

        List<Long> memberIds = memberPage.getContent().stream()
                .map(Member::getId)
                .toList();

        List<AdminMemberDtos.MemberListResponse> content;

        if (memberIds.isEmpty()) {
            content = List.of();
        } else {
            List<Member> membersWithRoles = memberRepository.findByIdIn(memberIds);

            Map<Long, Member> memberMap = new LinkedHashMap<>();
            for (Member member : membersWithRoles) {
                memberMap.put(member.getId(), member);
            }

            content = memberIds.stream()
                    .map(memberMap::get)
                    .map(this::toListResponse)
                    .toList();
        }

        return new PageResponse<>(
                content,
                memberPage.getNumber(),
                memberPage.getSize(),
                memberPage.getTotalElements(),
                memberPage.getTotalPages(),
                memberPage.isFirst(),
                memberPage.isLast()
        );
    }

    /**
     * 관리자 회원 상세 조회
     */
    @Transactional(readOnly = true)
    public AdminMemberDtos.MemberDetailResponse getMember(Long memberId) {
        Member member = memberRepository.findWithRolesById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다. id=" + memberId));

        return toDetailResponse(member);
    }

    /**
     * 이메일 중복체크
     */
    @Transactional(readOnly = true)
    public AdminMemberDtos.EmailDuplicateCheckResponse checkEmailDuplicate(String email) {
        String normalizedEmail = normalizeEmail(email);
        boolean available = !memberRepository.existsByEmail(normalizedEmail);
        return new AdminMemberDtos.EmailDuplicateCheckResponse(available);
    }

    /**
     * 관리자 회원 등록
     * - 이메일 인증 없이 등록
     * - 이메일 중복만 체크
     */
    @Transactional
    public AdminMemberDtos.MemberDetailResponse createMember(AdminMemberDtos.CreateMemberRequest req) {
        String normalizedEmail = normalizeEmail(req.email());
        String normalizedName = normalizeName(req.name());
        String normalizedPhoneNumber = normalizePhoneNumber(req.phoneNumber());

        if (memberRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        Member member = new Member();
        member.setEmail(normalizedEmail);
        member.setName(normalizedName);
        member.setPhoneNumber(normalizedPhoneNumber);
        member.setPasswordHash(passwordEncoder.encode(req.password()));
        member.setStatus(MemberStatus.fromLabel(req.status()));
        member.setPoint(req.point());
        member.setMemo(normalizeMemo(req.memo()));
        member.setZipCode(req.zipCode());
        member.setRoadAddress(req.roadAddress());
        member.setDetailAddress(req.detailAddress());

        /**
         * 관리자 등록은 이메일 인증 없이 바로 등록
         * - 서버 기본 타임존과 무관하게 한국 시간 기준으로 저장한다.
         */
        member.setEmailVerified(true);
        member.setEmailVerifiedAt(ApiDateTimeConverter.nowKst());

        applySingleRole(member, req.role());

        Member saved = memberRepository.save(member);
        return toDetailResponse(saved);
    }

    /**
     * 관리자 회원 수정
     * - 비밀번호는 입력했을 때만 변경
     */
    @Transactional
    public AdminMemberDtos.MemberDetailResponse updateMember(Long memberId, AdminMemberDtos.UpdateMemberRequest req) {
        Member member = memberRepository.findWithRolesById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다. id=" + memberId));

        member.setName(normalizeName(req.name()));
        member.setPhoneNumber(normalizePhoneNumber(req.phoneNumber()));
        member.setStatus(MemberStatus.fromLabel(req.status()));
        member.setPoint(req.point());
        member.setMemo(normalizeMemo(req.memo()));
        member.setZipCode(req.zipCode());
        member.setRoadAddress(req.roadAddress());
        member.setDetailAddress(req.detailAddress());

        if (req.password() != null && !req.password().isBlank()) {
            member.setPasswordHash(passwordEncoder.encode(req.password()));
        }

        applySingleRole(member, req.role());

        return toDetailResponse(member);
    }

    private AdminMemberDtos.MemberListResponse toListResponse(Member member) {
        boolean withdrawn = member.getStatus() == MemberStatus.WITHDRAWN;

        return new AdminMemberDtos.MemberListResponse(
                member.getId(),
                withdrawn ? maskValue() : member.getEmail(),
                withdrawn ? maskValue() : member.getName(),
                withdrawn ? maskValue() : member.getPhoneNumber(),
                toDisplayRole(member),
                member.getStatus().getLabel(),
                ApiDateTimeConverter.toUtcString(member.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(member.getLastLoginAt()),
                member.getPoint()
        );
    }

    private AdminMemberDtos.MemberDetailResponse toDetailResponse(Member member) {
        boolean withdrawn = member.getStatus() == MemberStatus.WITHDRAWN;

        return new AdminMemberDtos.MemberDetailResponse(
                member.getId(),
                withdrawn ? maskValue() : member.getEmail(),
                withdrawn ? maskValue() : member.getName(),
                withdrawn ? maskValue() : member.getPhoneNumber(),
                toDisplayRole(member),
                member.getStatus().getLabel(),
                member.getPoint(),
                withdrawn ? maskValue() : member.getZipCode(),
                withdrawn ? maskValue() : member.getRoadAddress(),
                withdrawn ? maskValue() : member.getDetailAddress(),
                withdrawn ? maskValue() : member.getMemo(),
                ApiDateTimeConverter.toUtcString(member.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(member.getLastLoginAt())
        );
    }

    private String maskValue() {
        return "*****";
    }

    /**
     * 프론트 표시용 역할명 변환
     */
    private String toDisplayRole(Member member) {
        boolean isAdmin = member.getRoles().stream()
                .map(Role::getName)
                .anyMatch(DB_ROLE_ADMIN::equals);

        return isAdmin ? "ADMIN" : "USER";
    }

    /**
     * 단일 역할 적용
     * - 현재 관리자 화면은 ADMIN / USER 단일 선택 기반으로 동작한다.
     */
    private void applySingleRole(Member member, String roleText) {
        String dbRoleName = "ADMIN".equalsIgnoreCase(roleText) ? DB_ROLE_ADMIN : DB_ROLE_USER;

        Role role = roleRepository.findByName(dbRoleName)
                .orElseThrow(() -> new IllegalArgumentException("역할을 찾을 수 없습니다. role=" + dbRoleName));

        member.getRoles().clear();
        member.getRoles().add(role);
    }

    /**
     * 이메일 정규화
     */
    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /**
     * 이름 정규화
     */
    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }

    /**
     * 휴대폰 번호 정규화
     * - 숫자 외 문자는 제거한다.
     */
    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return "";
        }

        return phoneNumber.replaceAll("[^0-9]", "");
    }

    /**
     * 메모 정규화
     */
    private String normalizeMemo(String memo) {
        if (memo == null) {
            return null;
        }

        String trimmed = memo.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

}
