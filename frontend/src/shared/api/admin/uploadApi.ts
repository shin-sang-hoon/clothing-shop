import { http } from "../http";

/**
 * apiUploadBrandImage
 * - 브랜드 아이콘 이미지를 업로드하고 저장된 경로를 반환한다.
 */
export async function apiUploadBrandImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await http.post<{ url: string }>(
        "/admin/upload/brand-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );

    return response.data.url;
}

/**
 * apiUploadCategoryImage
 * - 카테고리 이미지를 업로드하고 저장된 경로를 반환한다.
 */
export async function apiUploadCategoryImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await http.post<{ url: string }>(
        "/admin/upload/category-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );

    return response.data.url;
}

/**
 * apiUploadItemImage
 * - 상품 이미지를 업로드하고 저장된 경로를 반환한다.
 */
export async function apiUploadItemImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await http.post<{ url: string }>(
        "/admin/upload/item-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );

    return response.data.url;
}

export async function apiUploadMainBannerImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await http.post<{ url: string }>(
        "/admin/upload/main-banner-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );

    return response.data.url;
}
