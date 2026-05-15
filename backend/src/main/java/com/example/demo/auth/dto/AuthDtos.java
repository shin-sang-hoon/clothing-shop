package com.example.demo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * AuthDtos
 * - 인증 요청/응답 DTO 모음
 */
public class AuthDtos {

    /**
     * LoginRequest
     * - rememberMe:
     * true  -> 로그인 유지(지속 쿠키)
     * false -> 브라우저 종료 시 해제(세션 쿠키)
     */
    public record LoginRequest(
            @NotBlank(message = "이메일을 입력해주세요.")
            @Email(message = "올바른 이메일 형식이 아닙니다.")
            String email,

            @NotBlank(message = "비밀번호를 입력해주세요.")
            String password,

            Boolean rememberMe
    ) {
    }

    public record SignupRequest(
            @NotBlank(message = "이름을 입력해주세요.")
            @Size(min = 2, max = 20, message = "이름은 2자 이상 20자 이하로 입력해주세요.")
            String name,

            @NotBlank(message = "닉네임을 입력해주세요.")
            @Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하로 입력해주세요.")
            String nickname,

            @NotBlank(message = "전화번호를 입력해주세요.")
            @Pattern(regexp = "^\\d{10,11}$", message = "전화번호는 숫자 10~11자리여야 합니다.")
            String phoneNumber,

            @NotBlank(message = "이메일을 입력해주세요.")
            @Email(message = "올바른 이메일 형식이 아닙니다.")
            String email,

            @NotBlank(message = "비밀번호를 입력해주세요.")
            @Pattern(
                    regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
                    message = "비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다."
            )
            String password
    ) {
    }

    public record SendEmailCodeRequest(
            @NotBlank(message = "이메일을 입력해주세요.")
            @Email(message = "올바른 이메일 형식이 아닙니다.")
            String email
    ) {
    }

    public record VerifyEmailCodeRequest(
            @NotBlank(message = "이메일을 입력해주세요.")
            @Email(message = "올바른 이메일 형식이 아닙니다.")
            String email,

            @NotBlank(message = "인증번호를 입력해주세요.")
            @Pattern(regexp = "^\\d{6}$", message = "인증번호는 6자리 숫자여야 합니다.")
            String code
    ) {
    }

    public record FindEmailRequest(
            @NotBlank(message = "이름을 입력해주세요.")
            String name,

            @NotBlank(message = "전화번호를 입력해주세요.")
            @Pattern(regexp = "^\\d{10,11}$", message = "전화번호는 숫자 10~11자리여야 합니다.")
            String phoneNumber
    ) {
    }

    public record FindEmailResponse(
            String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "이메일을 입력해주세요.")
            @Email(message = "올바른 이메일 형식이 아닙니다.")
            String email,

            @NotBlank(message = "새 비밀번호를 입력해주세요.")
            @Pattern(
                    regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
                    message = "비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다."
            )
            String newPassword
    ) {
    }

    public record SocialConnectRequest(
            @NotBlank(message = "소셜 제공자 정보가 없습니다.")
            String provider,

            @NotBlank(message = "소셜 사용자 정보가 없습니다.")
            String providerUserId,

            String socialEmail,

            @NotBlank(message = "이메일을 입력해주세요.")
            @Email(message = "올바른 이메일 형식이 아닙니다.")
            String email,

            @NotBlank(message = "비밀번호를 입력해주세요.")
            String password
    ) {
    }

    public record MessageResponse(
            String message
    ) {
    }

    public record UserResponse(
            Long id,
            String name,
            String nickname,
            String email,
            String phoneNumber,
            String zipCode,
            String roadAddress,
            String detailAddress,
            Set<String> roles,
            Set<String> permissions
    ) {
    }

    public record LoginResponse(
            String accessToken,
            UserResponse user
    ) {
    }

    public record RefreshResponse(
            String accessToken
    ) {
    }
}
