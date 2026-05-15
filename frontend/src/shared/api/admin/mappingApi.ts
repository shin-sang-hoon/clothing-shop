import { http } from "../http";

export type AdminMappingItem = {
  id: number;
  name: string;
  code: string;
  sortOrder: number;
  useYn: boolean;
};

export type AdminMappingDetail = {
  ownerId: number;
  ownerName: string;
  filters: AdminMappingItem[];
  tags: AdminMappingItem[];
};

export type AdminUpdateMappingRequest = {
  filterIds: number[];
  tagIds: number[];
};

export type AdminBulkAutoSyncResponse = {
  totalCount: number;
  targetType: string;
};

export type AdminMappingJobStartResponse = {
  jobId: string;
  jobType: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  message: string;
};

export type AdminMappingJobStatusResponse = {
  jobId: string;
  jobType: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  message: string;
  startedAt: string;
  finishedAt: string | null;
  result: AdminBulkAutoSyncResponse | null;
};

export async function apiGetAdminCategoryMapping(categoryId: number) {
  const res = await http.get<AdminMappingDetail>(`/admin/mappings/categories/${categoryId}`);
  return res.data;
}

export async function apiUpdateAdminCategoryMapping(
  categoryId: number,
  payload: AdminUpdateMappingRequest,
) {
  const res = await http.put<AdminMappingDetail>(
    `/admin/mappings/categories/${categoryId}`,
    payload,
  );
  return res.data;
}

export async function apiAutoSyncAdminCategoryMapping(categoryId: number) {
  const res = await http.post<AdminMappingDetail>(`/admin/mappings/categories/${categoryId}/auto-sync`);
  return res.data;
}

export async function apiAutoSyncAllAdminCategoryMappings() {
  const res = await http.post<AdminMappingJobStartResponse>(`/admin/mappings/categories/auto-sync-all`);
  return res.data;
}

export async function apiGetAdminBrandMapping(brandId: number) {
  const res = await http.get<AdminMappingDetail>(`/admin/mappings/brands/${brandId}`);
  return res.data;
}

export async function apiUpdateAdminBrandMapping(
  brandId: number,
  payload: AdminUpdateMappingRequest,
) {
  const res = await http.put<AdminMappingDetail>(
    `/admin/mappings/brands/${brandId}`,
    payload,
  );
  return res.data;
}

export async function apiAutoSyncAdminBrandMapping(brandId: number) {
  const res = await http.post<AdminMappingDetail>(`/admin/mappings/brands/${brandId}/auto-sync`);
  return res.data;
}

export async function apiAutoSyncAllAdminBrandMappings() {
  const res = await http.post<AdminMappingJobStartResponse>(`/admin/mappings/brands/auto-sync-all`);
  return res.data;
}

export async function apiGetAdminMappingJobStatus(jobId: string) {
  const res = await http.get<AdminMappingJobStatusResponse>(`/admin/mappings/jobs/${jobId}`);
  return res.data;
}
