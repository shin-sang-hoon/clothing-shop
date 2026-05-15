import { http } from "../http";
import type { PageResponse } from "../common/page";
import { normalizeKeyword, normalizeOptionalValue } from "../common/query";

export type AdminTagRow = {
  id: number;
  name: string;
  code: string;
  sortOrder: number;
  useYn: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminTagDetail = AdminTagRow;
export type AdminTagPageResponse = PageResponse<AdminTagRow>;

export type AdminTagListParams = {
  page: number;
  size: number;
  keyword?: string;
  useYn?: boolean | "";
};

export type AdminTagCreateRequest = {
  name: string;
  code: string;
  sortOrder: number;
  useYn: boolean;
  description?: string | null;
};

export type AdminTagUpdateRequest = AdminTagCreateRequest;

export type AdminTagUseRequest = {
  useYn: boolean;
};

function buildAdminTagListParams(params: AdminTagListParams) {
  return {
    page: params.page,
    size: params.size,
    keyword: normalizeKeyword(params.keyword),
    useYn: normalizeOptionalValue(params.useYn),
  };
}

export async function apiGetAdminTags(params: AdminTagListParams) {
  const res = await http.get<AdminTagPageResponse>("/admin/tags", {
    params: buildAdminTagListParams(params),
  });
  return res.data;
}

export async function apiGetAdminTag(tagId: number) {
  const res = await http.get<AdminTagDetail>(`/admin/tags/${tagId}`);
  return res.data;
}

export async function apiCreateAdminTag(payload: AdminTagCreateRequest) {
  const res = await http.post<AdminTagDetail>("/admin/tags", payload);
  return res.data;
}

export async function apiUpdateAdminTag(
  tagId: number,
  payload: AdminTagUpdateRequest,
) {
  const res = await http.put<AdminTagDetail>(`/admin/tags/${tagId}`, payload);
  return res.data;
}

export async function apiUpdateAdminTagUse(
  tagId: number,
  payload: AdminTagUseRequest,
) {
  const res = await http.patch<AdminTagDetail>(`/admin/tags/${tagId}/use`, payload);
  return res.data;
}

export async function apiDeleteAdminTag(tagId: number) {
  await http.delete(`/admin/tags/${tagId}`);
}
