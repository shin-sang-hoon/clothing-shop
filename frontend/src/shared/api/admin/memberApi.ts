import { http } from "../http";
import type { PageResponse } from "../common/page";
import { normalizeKeyword } from "../common/query";

/**
 * 관리자 회원 관리 타입
 */
export type AdminMemberRole = "ADMIN" | "USER";
export type AdminMemberStatus = "정상" | "차단" | "탈퇴";

/**
 * AdminMemberListRow
 * - 관리자 회원 목록 1행 데이터
 */
export type AdminMemberListRow = {
    id: number;
    email: string;
    name: string;
    phoneNumber: string;
    role: AdminMemberRole;
    status: AdminMemberStatus;
    createdAt: string;
    lastLoginAt?: string | null;
    point: number;
};

/**
 * AdminMemberDetail
 * - 관리자 회원 상세/수정 데이터
 */
export type AdminMemberDetail = {
    id: number;
    email: string;
    name: string;
    phoneNumber: string;
    role: AdminMemberRole;
    status: AdminMemberStatus;
    point: number;
    zipCode?: string | null;
    roadAddress?: string | null;
    detailAddress?: string | null;
    memo?: string | null;
    createdAt: string;
    lastLoginAt?: string | null;
};

/**
 * AdminMemberPageResponse
 * - 관리자 회원 목록 페이징 응답
 */
export type AdminMemberPageResponse = PageResponse<AdminMemberListRow>;

/**
 * AdminMemberListParams
 * - 관리자 회원 목록 조회 파라미터
 */
export type AdminMemberListParams = {
    page: number;
    size: number;
    searchType?: "email" | "name" | "phoneNumber";
    keyword?: string;
    role?: AdminMemberRole | "";
    status?: AdminMemberStatus | "";
};

/**
 * AdminMemberCreateRequest
 * - 관리자 회원 등록 요청
 */
export type AdminMemberCreateRequest = {
    email: string;
    name: string;
    phoneNumber: string;
    role: AdminMemberRole;
    status: AdminMemberStatus;
    point: number;
    memo: string;
    zipCode?: string;
    roadAddress?: string;
    detailAddress?: string;
    password: string;
};

/**
 * AdminMemberUpdateRequest
 * - 관리자 회원 수정 요청
 */
export type AdminMemberUpdateRequest = {
    name: string;
    phoneNumber: string;
    role: AdminMemberRole;
    status: AdminMemberStatus;
    point: number;
    memo: string;
    zipCode?: string;
    roadAddress?: string;
    detailAddress?: string;
    password?: string;
};

/**
 * buildAdminMemberListParams
 * - 관리자 회원 목록 조회 파라미터 정리
 */
function buildAdminMemberListParams(params: AdminMemberListParams) {
    return {
        page: params.page,
        size: params.size,
        searchType: params.searchType || undefined,
        keyword: normalizeKeyword(params.keyword),
        role: params.role || undefined,
        status: params.status || undefined,
    };
}

/**
 * apiListAdminMembers
 * - 관리자 회원 목록 조회
 */
export async function apiListAdminMembers(params: AdminMemberListParams) {
    const res = await http.get<AdminMemberPageResponse>("/admin/members/manage", {
        params: buildAdminMemberListParams(params),
    });
    return res.data;
}

/**
 * apiGetAdminMember
 * - 관리자 회원 상세 조회
 */
export async function apiGetAdminMember(memberId: number) {
    const res = await http.get<AdminMemberDetail>(`/admin/members/manage/${memberId}`);
    return res.data;
}

/**
 * apiCheckAdminMemberEmail
 * - 관리자 회원 등록 이메일 중복확인
 */
export async function apiCheckAdminMemberEmail(email: string) {
    const res = await http.get<{ available: boolean }>("/admin/members/check-email", {
        params: { email },
    });
    return res.data;
}

/**
 * apiCreateAdminMember
 * - 관리자 회원 등록
 */
export async function apiCreateAdminMember(payload: AdminMemberCreateRequest) {
    const res = await http.post<AdminMemberDetail>("/admin/members/manage", payload);
    return res.data;
}

/**
 * apiUpdateAdminMember
 * - 관리자 회원 수정
 */
export async function apiUpdateAdminMember(
    memberId: number,
    payload: AdminMemberUpdateRequest,
) {
    const res = await http.put<AdminMemberDetail>(
        `/admin/members/manage/${memberId}`,
        payload,
    );
    return res.data;
}