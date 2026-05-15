import { http } from "../http";
import type { PageResponse } from "../common/page";
import { normalizeKeyword, normalizeOptionalValue } from "../common/query";
import type { TagGroupRole } from "../categoryApi";

export type AdminTagGroupRow = {
  id: number;
  name: string;
  code: string;
  multiSelectYn: boolean;
  role: TagGroupRole;
  sortOrder: number;
  useYn: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminTagGroupDetail = AdminTagGroupRow;
export type AdminTagGroupPageResponse = PageResponse<AdminTagGroupRow>;

export type AdminTagGroupWithTags = {
  id: number;
  name: string;
  code: string;
  multiSelectYn: boolean;
  role: TagGroupRole;
  sortOrder: number;
  useYn: boolean;
  tags: {
    id: number;
    name: string;
    code: string;
    colorHex?: string | null;
    iconImageUrl?: string | null;
  }[];
};

export type AdminTagGroupListParams = {
  page: number;
  size: number;
  keyword?: string;
  multiSelectYn?: boolean | "";
  useYn?: boolean | "";
};

export type AdminTagGroupCreateRequest = {
  name: string;
  code: string;
  multiSelectYn: boolean;
  role: TagGroupRole;
  sortOrder: number;
  useYn: boolean;
  description?: string | null;
};

export type AdminTagGroupUpdateRequest = AdminTagGroupCreateRequest;

export type AdminTagGroupUseRequest = {
  useYn: boolean;
};

function buildAdminTagGroupListParams(params: AdminTagGroupListParams) {
  return {
    page: params.page,
    size: params.size,
    keyword: normalizeKeyword(params.keyword),
    multiSelectYn: normalizeOptionalValue(params.multiSelectYn),
    useYn: normalizeOptionalValue(params.useYn),
  };
}

export async function apiGetAdminTagGroups(params: AdminTagGroupListParams) {
  const res = await http.get<AdminTagGroupPageResponse>("/admin/tag-groups", {
    params: buildAdminTagGroupListParams(params),
  });
  return res.data;
}

export async function apiGetAdminTagGroup(tagGroupId: number) {
  const res = await http.get<AdminTagGroupDetail>(`/admin/tag-groups/${tagGroupId}`);
  return res.data;
}

export async function apiGetAdminTagGroupsWithTags() {
  const res = await http.get<AdminTagGroupWithTags[]>("/admin/tag-groups/with-tags");
  return res.data;
}

export async function apiCreateAdminTagGroup(payload: AdminTagGroupCreateRequest) {
  const res = await http.post<AdminTagGroupDetail>("/admin/tag-groups", payload);
  return res.data;
}

export async function apiUpdateAdminTagGroup(tagGroupId: number, payload: AdminTagGroupUpdateRequest) {
  const res = await http.put<AdminTagGroupDetail>(`/admin/tag-groups/${tagGroupId}`, payload);
  return res.data;
}

export async function apiUpdateAdminTagGroupUse(tagGroupId: number, payload: AdminTagGroupUseRequest) {
  const res = await http.patch<AdminTagGroupDetail>(`/admin/tag-groups/${tagGroupId}/use`, payload);
  return res.data;
}

export async function apiDeleteAdminTagGroup(tagGroupId: number) {
  await http.delete(`/admin/tag-groups/${tagGroupId}`);
}
