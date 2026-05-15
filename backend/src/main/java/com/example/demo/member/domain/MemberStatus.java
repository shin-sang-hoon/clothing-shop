package com.example.demo.member.domain;

/**
 * MemberStatus
 * - 회원 상태값
 */
public enum MemberStatus {
    NORMAL("정상"),
    BLOCKED("차단"),
    WITHDRAWN("탈퇴");

    private final String label;

    MemberStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static MemberStatus fromLabel(String label) {
        if (label == null || label.isBlank()) {
            return NORMAL;
        }

        for (MemberStatus status : values()) {
            if (status.label.equals(label)) {
                return status;
            }
        }

        throw new IllegalArgumentException("지원하지 않는 회원 상태값입니다: " + label);
    }
}