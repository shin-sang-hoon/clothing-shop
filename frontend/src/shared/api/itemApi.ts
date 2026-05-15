import { http } from "./http";
import type { PageResponse } from "./common/page";

export type ShopItemResponse = {
  id: number;
  itemNo: string;
  name: string;
  brandId?: number | null;
  brandCode?: string | null;
  brand: string;
  categoryId?: number | null;
  categoryCode?: string | null;
  category: string;
  kind: string;
  retailPrice: number;
  rentalPrice: number | null;
  itemMode: string | null;
  likeCnt: number;
  viewCnt?: number;
  status: string;
  img: string | null;
  subImgs: string[];
};

export type ItemDetailTag = {
  id: number;
  name: string;
  code: string;
  colorHex: string | null;
};

export type ItemDetailTagGroup = {
  groupId: number;
  groupName: string;
  groupCode: string;
  tags: ItemDetailTag[];
};

export type ItemDetailResponse = {
  id: number;
  itemNo: string;
  name: string;
  brandId: number | null;
  brand: string;
  brandIconImageUrl: string | null;
  category: string;
  kind: string;
  retailPrice: number;
  rentalPrice: number | null;
  itemMode: string | null;
  likeCnt: number;
  status: string;
  img: string | null;
  subImgs: string[];
  description: string | null;
  tagGroups: ItemDetailTagGroup[];
};

export async function apiGetShopItems(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  categoryCode?: string;
  brand?: string;
  brandCode?: string;
  filterIds?: number[];
  tagIds?: number[];
  itemMode?: string;
}): Promise<PageResponse<ShopItemResponse>> {
  const { page = 0, size = 30, filterIds, tagIds, itemMode, ...rest } = params ?? {};
  const res = await http.post<PageResponse<ShopItemResponse>>("/items/search", {
    page,
    size,
    ...rest,
    ...(filterIds && filterIds.length > 0 ? { filterIds } : {}),
    ...(tagIds && tagIds.length > 0 ? { tagIds } : {}),
    ...(itemMode ? { itemMode } : {}),
  });
  return res.data;
}

export async function apiGetItemDetail(itemId: number): Promise<ItemDetailResponse> {
  const res = await http.get<ItemDetailResponse>(`/items/${itemId}`);
  return res.data;
}

export async function apiGetHomePopularItems(params?: {
  size?: number;
  itemMode?: string;
}): Promise<ShopItemResponse[]> {
  const res = await http.get<{ items: ShopItemResponse[]; cacheSource: string }>("/public/home/items/popular", {
    params: {
      size: params?.size ?? 20,
      ...(params?.itemMode ? { itemMode: params.itemMode } : {}),
    },
  });
  return res.data.items ?? [];
}

export async function apiGetHomeRecommendItems(params?: {
  size?: number;
  itemMode?: string;
}): Promise<ShopItemResponse[]> {
  const res = await http.get<{ items: ShopItemResponse[]; cacheSource: string }>("/public/home/items/recommend", {
    params: {
      size: params?.size ?? 10,
      ...(params?.itemMode ? { itemMode: params.itemMode } : {}),
    },
  });
  return res.data.items ?? [];
}

export async function apiAdminSyncBoutique(
  categoryCode: string,
  threshold = 500000,
): Promise<{ categoryCode: string; totalCount: number; modeToRental: number; modeToAuction: number }> {
  const res = await http.patch("/admin/items/sync-boutique", null, {
    params: { categoryCode, threshold },
  });
  return res.data;
}
