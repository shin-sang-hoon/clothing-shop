import { http } from "./http";
import type { PageResponse } from "./common/page";
import { normalizeKeyword } from "./common/query";

/**
 * UserBrandRow
 * - 사용자 사이드바에 표시할 브랜드 1행 데이터
 */
export type UserBrandRow = {
  id: number;
  code: string;
  nameKo: string;
  nameEn?: string | null;
  iconImageUrl?: string | null;
  exclusiveYn: boolean;
  sortOrder: number;
  likeCnt?: number;
};

/**
 * UserBrandPageResponse
 * - 사용자 브랜드 페이징 응답
 */
export type UserBrandPageResponse = PageResponse<UserBrandRow>;

/**
 * UserBrandListParams
 * - 사용자 브랜드 목록 조회 파라미터
 */
export type UserBrandListParams = {
  page: number;
  size: number;
  keyword?: string;
  initialConsonant?: string;
  sort?: "default" | "nameAsc" | "nameDesc";
};

/**
 * buildUserBrandListParams
 * - 불필요한 빈값을 제거해서 요청 파라미터를 정리한다.
 */
function buildUserBrandListParams(params: UserBrandListParams) {
  return {
    page: params.page,
    size: params.size,
    keyword: normalizeKeyword(params.keyword),
    initialConsonant: params.initialConsonant?.trim() || undefined,
    sort: params.sort ?? "default",
  };
}

/**
 * apiGetBrands
 * - 사용자 노출용 브랜드 목록 조회
 */
export async function apiGetBrands(params: UserBrandListParams) {
  const response = await http.get<UserBrandPageResponse>("/brands", {
    params: buildUserBrandListParams(params),
  });

  return response.data;
}

export async function apiGetBrandById(id: number) {
  const response = await http.get<UserBrandRow>(`/brands/${id}`);
  return response.data;
}
