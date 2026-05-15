import { http } from "../http";
import type { PageResponse } from "../common/page";
import { normalizeKeyword, normalizeOptionalValue } from "../common/query";

/**
 * AdminBrandRow
 * - 브랜드 목록 1행
 */
export type AdminBrandRow = {
    id: number;
    code: string;
    nameKo: string;
    nameEn: string;
    iconImageUrl?: string | null;
    exclusiveYn: boolean;
    sortOrder: number;
    useYn: boolean;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
};

/**
 * AdminBrandDetail
 * - 브랜드 상세
 */
export type AdminBrandDetail = AdminBrandRow;

/**
 * AdminBrandPageResponse
 * - 브랜드 목록 페이징 응답
 */
export type AdminBrandPageResponse = PageResponse<AdminBrandRow>;

/**
 * AdminBrandListParams
 * - 브랜드 목록 조회 파라미터
 */
export type AdminBrandListParams = {
    page: number;
    size: number;
    keyword?: string;
    exclusiveYn?: boolean | "";
    useYn?: boolean | "";
};

/**
 * AdminBrandCreateRequest
 * - 브랜드 등록 요청
 */
export type AdminBrandCreateRequest = {
    code: string;
    nameKo: string;
    nameEn: string;
    iconImageUrl?: string | null;
    exclusiveYn: boolean;
    sortOrder: number;
    useYn: boolean;
    description?: string | null;
};

/**
 * AdminBrandUpdateRequest
 * - 브랜드 수정 요청
 */
export type AdminBrandUpdateRequest = {
    code: string;
    nameKo: string;
    nameEn: string;
    iconImageUrl?: string | null;
    exclusiveYn: boolean;
    sortOrder: number;
    useYn: boolean;
    description?: string | null;
};

/**
 * AdminBrandUseRequest
 * - 브랜드 사용여부 변경 요청
 */
export type AdminBrandUseRequest = {
    useYn: boolean;
};

/**
 * buildAdminBrandListParams
 * - 관리자 브랜드 목록 조회 파라미터 정리
 */
function buildAdminBrandListParams(params: AdminBrandListParams) {
    return {
        page: params.page,
        size: params.size,
        keyword: normalizeKeyword(params.keyword),
        exclusiveYn: normalizeOptionalValue(params.exclusiveYn),
        useYn: normalizeOptionalValue(params.useYn),
    };
}

/**
 * apiGetAdminBrands
 * - 관리자 브랜드 목록 조회
 */
export async function apiGetAdminBrands(params: AdminBrandListParams) {
    const res = await http.get<AdminBrandPageResponse>("/admin/brands", {
        params: buildAdminBrandListParams(params),
    });
    return res.data;
}

/**
 * apiGetAdminBrand
 * - 관리자 브랜드 상세 조회
 */
export async function apiGetAdminBrand(brandId: number) {
    const res = await http.get<AdminBrandDetail>(`/admin/brands/${brandId}`);
    return res.data;
}

/**
 * apiCreateAdminBrand
 * - 관리자 브랜드 등록
 */
export async function apiCreateAdminBrand(payload: AdminBrandCreateRequest) {
    const res = await http.post<AdminBrandDetail>("/admin/brands", payload);
    return res.data;
}

/**
 * apiUpdateAdminBrand
 * - 관리자 브랜드 수정
 */
export async function apiUpdateAdminBrand(
    brandId: number,
    payload: AdminBrandUpdateRequest,
) {
    const res = await http.put<AdminBrandDetail>(`/admin/brands/${brandId}`, payload);
    return res.data;
}

/**
 * apiUpdateAdminBrandUse
 * - 관리자 브랜드 사용여부 변경
 */
export async function apiUpdateAdminBrandUse(
    brandId: number,
    payload: AdminBrandUseRequest,
) {
    const res = await http.patch<AdminBrandDetail>(
        `/admin/brands/${brandId}/use`,
        payload,
    );
    return res.data;
}

/**
 * apiDeleteAdminBrand
 * - 관리자 브랜드 삭제
 */
export async function apiDeleteAdminBrand(brandId: number) {
    await http.delete(`/admin/brands/${brandId}`);
}

/**
 * apiDeleteEmptyBrands
 * - 상품 없는 브랜드 일괄 삭제
 */
export async function apiDeleteEmptyBrands(): Promise<{ deleted: number }> {
    const res = await http.delete<{ deleted: number }>("/admin/brands/cleanup/empty");
    return res.data;
}

/**
 * apiSeedBrandDummyLikes
 * - 더미 좋아요 수 일괄 부여
 */
export async function apiSeedBrandDummyLikes(): Promise<{ updated: number }> {
    const res = await http.post<{ updated: number }>("/admin/brands/seed-dummy-likes");
    return res.data;
}