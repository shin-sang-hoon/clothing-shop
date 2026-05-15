import { http } from "@/shared/api/http";
import type { PageResponse } from "@/shared/api/common/page";

export type AuditCategory = "MEMBER" | "ADMIN" | "SHOP" | "CHAT" | "SYSTEM";
export type AuditResult = "SUCCESS" | "FAIL";

export type AdminAuditLogRow = {
  id: number;
  category: AuditCategory;
  eventType: string;
  result: AuditResult;
  actorId: number | null;
  actorEmail: string | null;
  message: string | null;
  ipAddress: string | null;
  requestUri: string | null;
  httpMethod: string | null;
  createdAt: string;
};

export type AdminAuditLogPageResponse = PageResponse<AdminAuditLogRow>;

export type AdminAuditLogListParams = {
  page: number;
  size: number;
  category?: AuditCategory | "";
  result?: AuditResult | "";
  keyword?: string;
};

export async function apiGetAdminAuditLogs(
  params: AdminAuditLogListParams,
): Promise<AdminAuditLogPageResponse> {
  const response = await http.get<AdminAuditLogPageResponse>("/admin/logs", {
    params: {
      page: params.page,
      size: params.size,
      category: params.category || undefined,
      result: params.result || undefined,
      keyword: params.keyword?.trim() || undefined,
    },
  });

  return response.data;
}
