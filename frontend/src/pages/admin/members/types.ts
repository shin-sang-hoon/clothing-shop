/**
 * MemberTabKey
 * - 회원 목록 상단 탭 상태
 */
export type MemberTabKey = "all" | "blocked" | "withdrawn";

/**
 * MemberSearchType
 * - 회원 검색 조건 타입
 * - 현재 관리자 회원 목록은 이메일 / 이름 / 휴대폰 번호 기준 검색
 */
export type MemberSearchType = "email" | "name" | "phoneNumber";

/**
 * MemberRole
 * - 관리자 회원 역할
 * - 현재는 USER / ADMIN 두 가지만 사용
 */
export type MemberRole = "ADMIN" | "USER";

/**
 * MemberStatus
 * - 관리자 회원 상태값
 */
export type MemberStatus = "정상" | "차단" | "탈퇴";

/**
 * MemberRow
 * - 관리자 회원 목록 1행 데이터 타입
 * - 백엔드 관리자 회원 목록 응답 기준
 */
export interface MemberRow {
    id: number;
    email: string;
    name: string;
    phoneNumber: string;
    role: MemberRole;
    status: MemberStatus;
    createdAt: string;
    lastLoginAt?: string | null;
    point: number;
}

/**
 * MemberDetailRow
 * - 관리자 회원 상세/수정 화면용 데이터 타입
 * - 목록 데이터 + 메모 포함
 */
export interface MemberDetailRow extends MemberRow {
    memo?: string | null;
}

/**
 * MemberPageResponse
 * - 관리자 회원 목록 페이징 응답 타입
 */
export interface MemberPageResponse {
    content: MemberRow[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

/**
 * MemberSearchForm
 * - 검색 입력 상태 타입
 * - 화면 입력값과 실제 적용값을 구분할 때 사용
 */
export interface MemberSearchForm {
    searchType: MemberSearchType;
    keyword: string;
    roleFilter: "" | MemberRole;
    statusFilter: "" | MemberStatus;
}