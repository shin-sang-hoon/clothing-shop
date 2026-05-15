import { http } from "../http";
import type { PageResponse } from "../common/page";
import {
    normalizeKeyword,
    normalizeOptionalValue,
    normalizeParentId,
} from "../common/query";

/**
 * CategorySearchType
 * - 카테고리 검색 구분
 *
 * 주의:
 * - 현재 백엔드가 searchType을 받지 않으므로
 *   프론트 UI 상태용으로만 사용한다.
 */
export type CategorySearchType = "name" | "code";

/**
 * AdminCategoryRow
 * - 카테고리 목록 1행
 */
export type AdminCategoryRow = {
    id: number;
    name: string;
    code: string;
    depth: number;
    parentId?: number | null;
    parentName?: string | null;
    sortOrder: number;
    useYn: boolean;
    imageUrl?: string | null;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
};

/**
 * AdminCategoryDetail
 * - 카테고리 상세
 */
export type AdminCategoryDetail = AdminCategoryRow;

/**
 * AdminCategoryPageResponse
 * - 카테고리 목록 페이징 응답
 */
export type AdminCategoryPageResponse = PageResponse<AdminCategoryRow>;

/**
 * AdminCategoryListParams
 * - 카테고리 목록 조회 파라미터
 */
export type AdminCategoryListParams = {
    page: number;
    size: number;
    searchType?: CategorySearchType;
    keyword?: string;
    useYn?: boolean | "";
};

/**
 * AdminCategoryCreateRequest
 * - 카테고리 등록 요청
 */
export type AdminCategoryCreateRequest = {
    name: string;
    code: string;
    parentId?: number | null;
    sortOrder: number;
    useYn: boolean;
    imageUrl?: string | null;
    description?: string | null;
};

/**
 * AdminCategoryUpdateRequest
 * - 카테고리 수정 요청
 */
export type AdminCategoryUpdateRequest = {
    name: string;
    code: string;
    parentId?: number | null;
    sortOrder: number;
    useYn: boolean;
    imageUrl?: string | null;
    description?: string | null;
};

/**
 * AdminCategoryUseRequest
 * - 관리자 카테고리 사용여부 변경 요청
 */
export type AdminCategoryUseRequest = {
    useYn: boolean;
};

/**
 * buildAdminCategoryListParams
 * - 관리자 카테고리 목록 조회 파라미터 정리
 *
 * 주의:
 * - searchType은 현재 백엔드에서 받지 않으므로 전송하지 않는다.
 */
function buildAdminCategoryListParams(params: AdminCategoryListParams) {
    return {
        page: params.page,
        size: params.size,
        keyword: normalizeKeyword(params.keyword),
        useYn: normalizeOptionalValue(params.useYn),
    };
}

/**
 * apiGetAdminCategories
 * - 관리자 카테고리 목록 조회
 */
export async function apiGetAdminCategories(params: AdminCategoryListParams) {
    const res = await http.get<AdminCategoryPageResponse>("/admin/categories", {
        params: buildAdminCategoryListParams(params),
    });
    return res.data;
}

/**
 * apiGetAdminCategory
 * - 관리자 카테고리 상세 조회
 */
export async function apiGetAdminCategory(categoryId: number) {
    const res = await http.get<AdminCategoryDetail>(`/admin/categories/${categoryId}`);
    return res.data;
}

/**
 * apiCreateAdminCategory
 * - 관리자 카테고리 등록
 */
export async function apiCreateAdminCategory(payload: AdminCategoryCreateRequest) {
    const normalizedPayload: AdminCategoryCreateRequest = {
        ...payload,
        parentId: normalizeParentId(payload.parentId),
    };

    const res = await http.post<AdminCategoryDetail>("/admin/categories", normalizedPayload);
    return res.data;
}

/**
 * apiUpdateAdminCategory
 * - 관리자 카테고리 수정
 */
export async function apiUpdateAdminCategory(
    categoryId: number,
    payload: AdminCategoryUpdateRequest,
) {
    const normalizedPayload: AdminCategoryUpdateRequest = {
        ...payload,
        parentId: normalizeParentId(payload.parentId),
    };

    const res = await http.put<AdminCategoryDetail>(
        `/admin/categories/${categoryId}`,
        normalizedPayload,
    );
    return res.data;
}

/**
 * apiUpdateAdminCategoryUse
 * - 관리자 카테고리 사용여부 변경
 */
export async function apiUpdateAdminCategoryUse(
    categoryId: number,
    payload: AdminCategoryUseRequest,
) {
    const res = await http.patch<AdminCategoryDetail>(
        `/admin/categories/${categoryId}/use`,
        payload,
    );
    return res.data;
}

/**
 * apiDeleteAdminCategory
 * - 관리자 카테고리 삭제
 */
export async function apiDeleteAdminCategory(categoryId: number) {
    await http.delete(`/admin/categories/${categoryId}`);
}