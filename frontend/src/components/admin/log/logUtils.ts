import type { AuditCategory, AuditResult } from "@/shared/api/admin/logApi";
import styles from "@/pages/admin/admin.module.css";

export const CATEGORY_LABELS: Record<AuditCategory, string> = {
    MEMBER: "회원",
    ADMIN: "관리자",
    SHOP: "카탈로그",
    CHAT: "채팅",
    SYSTEM: "시스템",
};

export const RESULT_LABELS: Record<AuditResult, string> = {
    SUCCESS: "성공",
    FAIL: "실패",
};

export const CATEGORY_TABS: Array<{ label: string; value: AuditCategory | "" }> = [
    { label: "전체", value: "" },
    { label: "회원", value: "MEMBER" },
    { label: "관리자", value: "ADMIN" },
    { label: "카탈로그", value: "SHOP" },
    { label: "채팅", value: "CHAT" },
    { label: "시스템", value: "SYSTEM" },
];

export const EVENT_LABELS: Record<string, string> = {
    LOGIN_SUCCESS: "로그인 성공",
    LOGIN_FAIL: "로그인 실패",
    LOGOUT: "로그아웃",
    SIGNUP_SUCCESS: "회원가입",
    PASSWORD_RESET_SUCCESS: "비밀번호 재설정",
    TOKEN_REFRESH: "토큰 재발급",
    SOCIAL_CONNECT: "소셜 계정 연결",
    MEMBER_CREATE: "회원 생성",
    MEMBER_UPDATE: "회원 수정",
    MEMBER_ROLE_UPDATE: "회원 역할 변경",
    MEMBER_PERMISSION_UPDATE: "회원 권한 변경",
    ROLE_CREATE: "역할 생성",
    ROLE_UPDATE: "역할 수정",
    ROLE_DELETE: "역할 삭제",
    ROLE_PERMISSION_UPDATE: "역할 권한 변경",
    PERMISSION_CREATE: "권한 생성",
    PERMISSION_UPDATE: "권한 수정",
    PERMISSION_DELETE: "권한 삭제",
    CATEGORY_CREATE: "카테고리 생성",
    CATEGORY_UPDATE: "카테고리 수정",
    CATEGORY_USE_UPDATE: "카테고리 사용여부 변경",
    CATEGORY_DELETE: "카테고리 삭제",
    BRAND_CREATE: "브랜드 생성",
    BRAND_UPDATE: "브랜드 수정",
    BRAND_USE_UPDATE: "브랜드 사용여부 변경",
    TAG_GROUP_CREATE: "태그그룹 생성",
    TAG_GROUP_UPDATE: "태그그룹 수정",
    TAG_GROUP_USE_UPDATE: "태그그룹 사용여부 변경",
    TAG_CREATE: "태그 생성",
    TAG_UPDATE: "태그 수정",
    TAG_USE_UPDATE: "태그 사용여부 변경",
    ITEM_CREATE: "상품 생성",
    ITEM_UPDATE: "상품 수정",
    ITEM_USE_UPDATE: "상품 사용여부 변경",
    CATALOG_CATEGORY_IMPORT: "카테고리 크롤링 반영",
    CATALOG_BRAND_IMPORT: "브랜드 크롤링 반영",
    CATALOG_TAG_IMPORT: "태그 크롤링 반영",
};

export function formatDateTime(value: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(date);
}

export function getCategoryBadgeClass(category: AuditCategory): string {
    switch (category) {
        case "MEMBER": return styles.badgeBlue;
        case "ADMIN":  return styles.badgePurple;
        case "SHOP":   return styles.badgeGreen;
        case "CHAT":   return styles.badgeOrange;
        default:       return styles.badgeGray;
    }
}

export function getResultBadgeClass(result: AuditResult): string {
    return result === "SUCCESS" ? styles.badgeGreen : styles.badgeRed;
}
