import { http } from "../http";

export type AdminMainBannerRow = {
  id: number;
  code: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder: number;
  useYn: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicMainBannerRow = {
  id: number;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder: number;
};

export type AdminMainBannerSaveRequest = {
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder: number;
  useYn: boolean;
  description?: string | null;
};

export type MainBannerImportResult = {
  totalCount: number;
  importedCount: number;
  skippedCount: number;
};

export async function apiGetAdminMainBanners() {
  const response = await http.get<AdminMainBannerRow[]>("/admin/main-banners");
  return response.data;
}

export async function apiImportAdminMainBanners() {
  const response = await http.post<MainBannerImportResult>("/admin/main-banners/import");
  return response.data;
}

export async function apiCreateAdminMainBanner(payload: AdminMainBannerSaveRequest) {
  const response = await http.post<AdminMainBannerRow>("/admin/main-banners", payload);
  return response.data;
}

export async function apiUpdateAdminMainBanner(
  bannerId: number,
  payload: AdminMainBannerSaveRequest,
) {
  const response = await http.put<AdminMainBannerRow>(`/admin/main-banners/${bannerId}`, payload);
  return response.data;
}

export async function apiDeleteAdminMainBanner(bannerId: number) {
  await http.delete(`/admin/main-banners/${bannerId}`);
}

export async function apiDeleteAdminMainBanners(bannerIds: number[]) {
  await Promise.all(bannerIds.map((id) => http.delete(`/admin/main-banners/${id}`)));
}

export async function apiGetPublicMainBanners() {
  const response = await http.get<PublicMainBannerRow[]>("/main-banners");
  return response.data;
}
