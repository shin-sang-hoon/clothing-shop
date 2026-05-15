import { http } from "../http";
import type { PageResponse } from "../common/page";
import { normalizeKeyword, normalizeOptionalValue } from "../common/query";
import type { FilterGroupRole } from "../categoryApi";

export type AdminFilterGroupRow = {
  id: number;
  name: string;
  code: string;
  multiSelectYn: boolean;
  role: FilterGroupRole;
  sortOrder: number;
  useYn: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFilterGroupDetail = AdminFilterGroupRow;
export type AdminFilterGroupPageResponse = PageResponse<AdminFilterGroupRow>;

export type AdminFilterGroupWithFilters = {
  id: number;
  name: string;
  code: string;
  multiSelectYn: boolean;
  role: FilterGroupRole;
  sortOrder: number;
  useYn: boolean;
  filters: {
    id: number;
    name: string;
    code: string;
    colorHex?: string | null;
    iconImageUrl?: string | null;
  }[];
};

export type AdminFilterGroupListParams = {
  page: number;
  size: number;
  keyword?: string;
  multiSelectYn?: boolean | "";
  useYn?: boolean | "";
};

export type AdminFilterGroupCreateRequest = {
  name: string;
  code: string;
  multiSelectYn: boolean;
  role: FilterGroupRole;
  sortOrder: number;
  useYn: boolean;
  description?: string | null;
};

export type AdminFilterGroupUpdateRequest = AdminFilterGroupCreateRequest;

export type AdminFilterGroupUseRequest = {
  useYn: boolean;
};

function buildAdminFilterGroupListParams(params: AdminFilterGroupListParams) {
  return {
    page: params.page,
    size: params.size,
    keyword: normalizeKeyword(params.keyword),
    multiSelectYn: normalizeOptionalValue(params.multiSelectYn),
    useYn: normalizeOptionalValue(params.useYn),
  };
}

export async function apiGetAdminFilterGroups(params: AdminFilterGroupListParams) {
  const res = await http.get<AdminFilterGroupPageResponse>("/admin/filter-groups", {
    params: buildAdminFilterGroupListParams(params),
  });
  return res.data;
}

export async function apiGetAdminFilterGroup(filterGroupId: number) {
  const res = await http.get<AdminFilterGroupDetail>(`/admin/filter-groups/${filterGroupId}`);
  return res.data;
}

export async function apiGetAdminFilterGroupsWithFilters() {
  const res = await http.get<AdminFilterGroupWithFilters[]>("/admin/filter-groups/with-filters");
  return res.data;
}

export async function apiCreateAdminFilterGroup(payload: AdminFilterGroupCreateRequest) {
  const res = await http.post<AdminFilterGroupDetail>("/admin/filter-groups", payload);
  return res.data;
}

export async function apiUpdateAdminFilterGroup(
  filterGroupId: number,
  payload: AdminFilterGroupUpdateRequest,
) {
  const res = await http.put<AdminFilterGroupDetail>(`/admin/filter-groups/${filterGroupId}`, payload);
  return res.data;
}

export async function apiUpdateAdminFilterGroupUse(
  filterGroupId: number,
  payload: AdminFilterGroupUseRequest,
) {
  const res = await http.patch<AdminFilterGroupDetail>(`/admin/filter-groups/${filterGroupId}/use`, payload);
  return res.data;
}

export async function apiDeleteAdminFilterGroup(filterGroupId: number) {
  await http.delete(`/admin/filter-groups/${filterGroupId}`);
}
