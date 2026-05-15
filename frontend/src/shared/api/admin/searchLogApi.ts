import { http } from "@/shared/api/http";
import type { PageResponse } from "@/shared/api/common/page";

export type AdminSearchLogRow = {
  id: number;
  memberId: number | null;
  memberEmail: string | null;
  keyword: string;
  normalizedKeyword: string;
  ipAddress: string | null;
  userAgent: string | null;
  searchedAt: string;
};

export type AdminSearchLogPageResponse = PageResponse<AdminSearchLogRow>;
export type AdminFilterActionLogRow = {
  id: number;
  memberId: number | null;
  memberEmail: string | null;
  filterId: number | null;
  filterName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
};

export type AdminFilterActionLogPageResponse = PageResponse<AdminFilterActionLogRow>;

export type AdminSearchLogListParams = {
  page: number;
  size: number;
  keyword?: string;
  memberEmail?: string;
  ipAddress?: string;
};

export async function apiGetAdminSearchLogs(
  params: AdminSearchLogListParams,
): Promise<AdminSearchLogPageResponse> {
  const response = await http.get<AdminSearchLogPageResponse>("/admin/search-logs", {
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword?.trim() || undefined,
      memberEmail: params.memberEmail?.trim() || undefined,
      ipAddress: params.ipAddress?.trim() || undefined,
    },
  });
  return response.data;
}

export type AdminFilterActionLogListParams = {
  page: number;
  size: number;
  filterName?: string;
  memberEmail?: string;
  ipAddress?: string;
};

export async function apiGetAdminFilterActionLogs(
  params: AdminFilterActionLogListParams,
): Promise<AdminFilterActionLogPageResponse> {
  const response = await http.get<AdminFilterActionLogPageResponse>("/admin/search-logs/filters", {
    params: {
      page: params.page,
      size: params.size,
      filterName: params.filterName?.trim() || undefined,
      memberEmail: params.memberEmail?.trim() || undefined,
      ipAddress: params.ipAddress?.trim() || undefined,
    },
  });
  return response.data;
}
