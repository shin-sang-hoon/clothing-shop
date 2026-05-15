import { http } from "../http";
import type { PageResponse } from "../common/page";
import { normalizeKeyword, normalizeOptionalValue } from "../common/query";

export type AdminFilterRow = {
  id: number;
  filterGroupId: number;
  filterGroupName: string;
  name: string;
  code: string;
  sortOrder: number;
  useYn: boolean;
  colorHex?: string | null;
  iconImageUrl?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFilterDetail = AdminFilterRow;
export type AdminFilterPageResponse = PageResponse<AdminFilterRow>;

export type AdminFilterListParams = {
  page: number;
  size: number;
  filterGroupId?: number | "";
  keyword?: string;
  useYn?: boolean | "";
};

export type AdminFilterCreateRequest = {
  filterGroupId: number;
  name: string;
  code: string;
  sortOrder: number;
  useYn: boolean;
  colorHex?: string | null;
  iconImageUrl?: string | null;
  description?: string | null;
};

export type AdminFilterUpdateRequest = AdminFilterCreateRequest;

export type AdminFilterUseRequest = {
  useYn: boolean;
};

function buildAdminFilterListParams(params: AdminFilterListParams) {
  return {
    page: params.page,
    size: params.size,
    filterGroupId: normalizeOptionalValue(params.filterGroupId),
    keyword: normalizeKeyword(params.keyword),
    useYn: normalizeOptionalValue(params.useYn),
  };
}

export async function apiGetAdminFilters(params: AdminFilterListParams) {
  const res = await http.get<AdminFilterPageResponse>("/admin/filters", {
    params: buildAdminFilterListParams(params),
  });
  return res.data;
}

export async function apiGetAdminFilter(filterId: number) {
  const res = await http.get<AdminFilterDetail>(`/admin/filters/${filterId}`);
  return res.data;
}

export async function apiCreateAdminFilter(payload: AdminFilterCreateRequest) {
  const res = await http.post<AdminFilterDetail>("/admin/filters", payload);
  return res.data;
}

export async function apiUpdateAdminFilter(
  filterId: number,
  payload: AdminFilterUpdateRequest,
) {
  const res = await http.put<AdminFilterDetail>(`/admin/filters/${filterId}`, payload);
  return res.data;
}

export async function apiUpdateAdminFilterUse(
  filterId: number,
  payload: AdminFilterUseRequest,
) {
  const res = await http.patch<AdminFilterDetail>(`/admin/filters/${filterId}/use`, payload);
  return res.data;
}

export async function apiDeleteAdminFilter(filterId: number) {
  await http.delete(`/admin/filters/${filterId}`);
}
