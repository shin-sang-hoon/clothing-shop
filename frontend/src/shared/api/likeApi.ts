import { http } from "./http";

export type LikeToggleResponse = {
    liked: boolean;
    likeCnt: number;
};

export type LikedItemResponse = {
    itemId: number;
    itemNo: string;
    name: string;
    brandName: string;
    kind: string;
    rentalPrice: number;
    retailPrice: number;
    likeCnt: number;
    img: string | null;
    createdAt: string;
};

export type LikedBrandResponse = {
    brandId: number;
    nameKo: string;
    nameEn: string;
    iconImageUrl?: string | null;
    createdAt: string;
};

/** 상품 좋아요 토글 (POST = 좋아요 추가) */
export async function apiLikeItem(itemId: number): Promise<LikeToggleResponse> {
    const res = await http.post<LikeToggleResponse>(`/likes/items/${itemId}`);
    return res.data;
}

/** 상품 좋아요 취소 (DELETE) */
export async function apiUnlikeItem(itemId: number): Promise<LikeToggleResponse> {
    const res = await http.delete<LikeToggleResponse>(`/likes/items/${itemId}`);
    return res.data;
}

/** 상품 좋아요 여부 조회 */
export async function apiGetItemLikeStatus(itemId: number): Promise<LikeToggleResponse> {
    const res = await http.get<LikeToggleResponse>(`/likes/items/${itemId}/status`);
    return res.data;
}

/** 내가 좋아요한 상품 목록 */
export async function apiGetMyLikedItems(): Promise<LikedItemResponse[]> {
    const res = await http.get<LikedItemResponse[]>("/likes/items");
    return res.data;
}

/** 브랜드 좋아요 추가 */
export async function apiLikeBrand(brandId: number): Promise<LikeToggleResponse> {
    const res = await http.post<LikeToggleResponse>(`/likes/brands/${brandId}`);
    return res.data;
}

/** 브랜드 좋아요 취소 */
export async function apiUnlikeBrand(brandId: number): Promise<LikeToggleResponse> {
    const res = await http.delete<LikeToggleResponse>(`/likes/brands/${brandId}`);
    return res.data;
}

/** 브랜드 좋아요 여부 조회 */
export async function apiGetBrandLikeStatus(brandId: number): Promise<LikeToggleResponse> {
    const res = await http.get<LikeToggleResponse>(`/likes/brands/${brandId}/status`);
    return res.data;
}

/** 내가 좋아요한 브랜드 목록 */
export async function apiGetMyLikedBrands(): Promise<LikedBrandResponse[]> {
    const res = await http.get<LikedBrandResponse[]>("/likes/brands");
    return res.data;
}
