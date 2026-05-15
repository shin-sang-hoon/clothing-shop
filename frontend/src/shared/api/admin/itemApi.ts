import { http } from "../http";
import type { PageResponse } from "../common/page";
import { normalizeKeyword } from "../common/query";

/**
 * 관리자 상품 태그 응답 타입
 */
export type AdminItemTag = {
  id: number;
  name: string;
};

/**
 * 관리자 상품 옵션 값 응답 타입
 */
export type AdminItemOptionValue = {
  id: number;
  tagId: number | null;
  name: string;
  quantity: number;
  sortOrder: number;
};

/**
 * 관리자 상품 단건 응답 타입
 */
export type AdminItemResponse = {
  id: number;
  name: string;
  brandId: number;
  brand: string;
  categoryId: number;
  category: string;
  kind: string;
  retailPrice: number;
  rentalPrice: number | null;
  itemMode?: "AUCTION" | "RENTAL" | "BOTH" | null;
  status: string;
  description: string;
  img: string;
  subImgs: string[];
  tags: AdminItemTag[];
  optionItems: AdminItemOptionValue[];
  createdAt: string;
};

/**
 * 관리자 상품 목록 페이지 응답 타입
 */
export type AdminItemPageResponse = PageResponse<AdminItemResponse>;

/**
 * 관리자 상품 목록 조회 파라미터
 *
 * 병합 반영:
 * - hasFilter
 * - hasAttribute
 * - itemMode
 */
export type AdminItemListParams = {
  page: number;
  size: number;
  keyword?: string;
  kind?: string;
  status?: string;
  categoryId?: number;
  tagId?: number;
  hasFilter?: boolean;
  hasAttribute?: boolean;
  hasTag?: boolean;
  itemMode?: string;
};

/**
 * 관리자 상품 옵션 요청 타입
 */
export type AdminItemOptionRequest = {
  tagId?: number;
  optionValue?: string;
  quantity: number;
  sortOrder?: number;
};

/**
 * 관리자 상품 생성 요청 타입
 */
export type AdminItemCreateRequest = {
  name: string;
  brandId: number;
  categoryId: number;
  kind: string;
  retailPrice: number;
  rentalPrice: number | null;
  itemMode?: "AUCTION" | "RENTAL" | "BOTH";
  status: string;
  description: string;
  img: string;
  subImgs: string[];
  attributeTagIds: number[];
  optionItems: AdminItemOptionRequest[];
};

/**
 * 관리자 상품 수정 요청 타입
 */
export type AdminItemUpdateRequest = AdminItemCreateRequest;

/**
 * 목록 조회용 query params 생성
 *
 * - false 값은 undefined 처리해서 쿼리스트링에 불필요하게 실리지 않게 함
 * - itemMode 는 공백이면 제거
 */
function buildAdminItemListParams(params: AdminItemListParams) {
  return {
    page: params.page,
    size: params.size,
    keyword: normalizeKeyword(params.keyword),
    kind: params.kind || undefined,
    status: params.status || undefined,
    categoryId: params.categoryId || undefined,
    tagId: params.tagId || undefined,
    hasFilter: params.hasFilter ? true : undefined,
    hasAttribute: params.hasAttribute ? true : undefined,
    hasTag: params.hasTag ? true : undefined,
    itemMode: params.itemMode || undefined,
  };
}

/**
 * 관리자 상품 목록 조회
 */
export async function apiListAdminItems(params: AdminItemListParams) {
  const res = await http.get<AdminItemPageResponse>("/admin/items", {
    params: buildAdminItemListParams(params),
  });
  return res.data;
}

/**
 * 관리자 상품 상세 조회
 */
export async function apiGetAdminItem(itemId: number) {
  const res = await http.get<AdminItemResponse>(`/admin/items/${itemId}`);
  return res.data;
}

/**
 * 관리자 상품 등록
 */
export async function apiCreateAdminItem(payload: AdminItemCreateRequest) {
  const res = await http.post<AdminItemResponse>("/admin/items", payload);
  return res.data;
}

/**
 * 관리자 상품 수정
 */
export async function apiUpdateAdminItem(itemId: number, payload: AdminItemUpdateRequest) {
  const res = await http.put<AdminItemResponse>(`/admin/items/${itemId}`, payload);
  return res.data;
}

/**
 * 관리자 상품 단건 삭제
 */
export async function apiDeleteAdminItem(itemId: number) {
  await http.delete(`/admin/items/${itemId}`);
}

/**
 * 관리자 상품 선택 삭제
 */
export async function apiBulkDeleteAdminItems(itemIds: number[]) {
  await http.post("/admin/items/bulk-delete", { itemIds });
}

export type AdminCrawlJobStartResponse = {
  jobId: string;
  jobType: string;
  status: string;
  message: string;
};

export type AdminCrawlJobStatusResponse = {
  jobId: string;
  jobType: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  message: string;
  startedAt?: string;
  finishedAt?: string;
  result?: unknown;
};

export async function apiBulkCrawlAdminItemImages(itemIds: number[]) {
  const res = await http.post<AdminCrawlJobStartResponse>(
    "/admin/items/bulk-crawl-images",
    { itemIds },
  );
  return res.data;
}

export async function apiGetBulkCrawlAdminItemImagesJob(jobId: string) {
  const res = await http.get<AdminCrawlJobStatusResponse>(`/admin/items/bulk-crawl-images/jobs/${jobId}`);
  return res.data;
}

export async function apiCrawlAllAdminItemThumbnails() {
  const res = await http.post<AdminCrawlJobStartResponse>("/admin/items/crawl-thumbnails-all");
  return res.data;
}

/**
 * 렌탈 재고 초기화
 */
export async function apiInitRentalStock(): Promise<{ initialized: number }> {
  const res = await http.post<{ initialized: number }>("/admin/items/init-rental-stock");
  return res.data;
}
