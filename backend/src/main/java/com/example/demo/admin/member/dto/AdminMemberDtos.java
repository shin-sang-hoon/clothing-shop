package com.example.demo.admin.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * AdminMemberDtos
 */
public class AdminMemberDtos {

    /**
     * 기존 역할 변경 응답
     * - 기존 API 호환 유지용
     */
    public record MemberResponse(
            Long id,
            String email,
            List<String> roles
    ) {
    }

    /**
     * 기존 역할 변경 요청
     * - 기존 API 호환 유지용
     */
    public record UpdateMemberRolesRequest(
            @NotNull List<Long> roleIds
    ) {
    }

    /**
     * 관리자 회원 목록 1행 응답
     * - 시간은 UTC offset 포함 ISO 문자열로 응답한다.
     */
    public record MemberListResponse(
            Long id,
            String email,
            String name,
            String phoneNumber,
            String role,
            String status,
            String createdAt,
            String lastLoginAt,
            Integer point
    ) {
    }

    /**
     * 관리자 회원 상세 응답
     * - 시간은 UTC offset 포함 ISO 문자열로 응답한다.
     */
    public record MemberDetailResponse(
            Long id,
            String email,
            String name,
            String phoneNumber,
            String role,
            String status,
            Integer point,
            String zipCode,
            String roadAddress,
            String detailAddress,
            String memo,
            String createdAt,
            String lastLoginAt
    ) {
    }

    /**
     * 이메일 중복체크 응답
     */
    public record EmailDuplicateCheckResponse(
            boolean available
    ) {
    }

    /**
     * 관리자 회원 등록 요청
     * - 이메일 인증 없음
     * - 비밀번호 4자 이상
     */
    public record CreateMemberRequest(
            @NotBlank(message = "이메일을 입력해주세요.")
            @Email(message = "올바른 이메일 형식이 아닙니다.")
            String email,

            @NotBlank(message = "이름을 입력해주세요.")
            @Size(max = 50, message = "이름은 50자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "휴대폰 번호를 입력해주세요.")
            @Pattern(regexp = "^\\d{10,11}$", message = "휴대폰 번호는 숫자 10~11자리여야 합니다.")
            String phoneNumber,

            @NotBlank(message = "역할을 선택해주세요.")
            @Pattern(regexp = "^(ADMIN|USER)$", message = "역할은 ADMIN 또는 USER만 가능합니다.")
            String role,

            @NotBlank(message = "상태를 선택해주세요.")
            @Pattern(regexp = "^(정상|차단|탈퇴)$", message = "상태값이 올바르지 않습니다.")
            String status,

            @NotNull(message = "포인트를 입력해주세요.")
            Integer point,

            @Size(max = 1000, message = "메모는 1000자 이하로 입력해주세요.")
            String memo,

            @Size(max = 10, message = "우편번호는 10자 이하로 입력해주세요.")
            String zipCode,

            @Size(max = 300, message = "도로명 주소는 300자 이하로 입력해주세요.")
            String roadAddress,

            @Size(max = 200, message = "상세 주소는 200자 이하로 입력해주세요.")
            String detailAddress,

            @NotBlank(message = "비밀번호를 입력해주세요.")
            @Size(min = 4, message = "비밀번호는 4자 이상이어야 합니다.")
            String password
    ) {
    }

    /**
     * 관리자 회원 수정 요청
     * - 비밀번호는 입력한 경우에만 변경
     */
    public record UpdateMemberRequest(
            @NotBlank(message = "이름을 입력해주세요.")
            @Size(max = 50, message = "이름은 50자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "휴대폰 번호를 입력해주세요.")
            @Pattern(regexp = "^\\d{10,11}$", message = "휴대폰 번호는 숫자 10~11자리여야 합니다.")
            String phoneNumber,

            @NotBlank(message = "역할을 선택해주세요.")
            @Pattern(regexp = "^(ADMIN|USER)$", message = "역할은 ADMIN 또는 USER만 가능합니다.")
            String role,

            @NotBlank(message = "상태를 선택해주세요.")
            @Pattern(regexp = "^(정상|차단|탈퇴)$", message = "상태값이 올바르지 않습니다.")
            String status,

            @NotNull(message = "포인트를 입력해주세요.")
            Integer point,

            @Size(max = 1000, message = "메모는 1000자 이하로 입력해주세요.")
            String memo,

            @Size(max = 10, message = "우편번호는 10자 이하로 입력해주세요.")
            String zipCode,

            @Size(max = 300, message = "도로명 주소는 300자 이하로 입력해주세요.")
            String roadAddress,

            @Size(max = 200, message = "상세 주소는 200자 이하로 입력해주세요.")
            String detailAddress,

            @Size(min = 4, message = "비밀번호는 4자 이상이어야 합니다.")
            String password
    ) {
    }
}