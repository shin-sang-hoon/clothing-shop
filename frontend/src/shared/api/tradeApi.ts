import { http } from "./http";

export type ItemOptionResponse = {
  id: number;
  optionValue: string;
  quantity: number;
  sortOrder: number;
  sourceTagId: number | null;
};

export type BuyBidResponse = {
  id: number;
  itemId: number;
  itemName: string;
  itemImageUrl?: string | null;
  optionValue: string | null;
  price: number;
  status: string;
  paymentAmount: number;
  buyerEmail?: string;
  createdAt: string;
};

export type SellBidResponse = {
  id: number;
  itemId: number;
  itemName: string;
  itemImageUrl?: string | null;
  optionValue: string | null;
  price: number;
  status: string;
  sellerEmail?: string;
  createdAt: string;
};

export type ConcludedTradeResponse = {
  id: number;
  tradeNo: string | null;
  itemId: number;
  itemName: string;
  itemImageUrl?: string | null;
  optionValue: string | null;
  tradePrice: number;
  buyerEmail: string;
  sellerEmail: string;
  courier: string | null;
  trackingNumber: string | null;
  createdAt: string;
};

export type PriceHistoryPoint = { date: string; price: number };

export type TradeDrawerResponse = {
  options: ItemOptionResponse[];
  instantBuyPrice: number | null;
  instantSellPrice: number | null;
  priceHistory: PriceHistoryPoint[];
};

export type PlaceBidResult = { result: string; tradeId: number | null; message: string };

export type PageResult<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export async function apiGetTradeDrawer(itemId: number, optionId?: number | null): Promise<TradeDrawerResponse> {
  const res = await http.get<TradeDrawerResponse>(`/trade/items/${itemId}/drawer`, {
    params: optionId ? { optionId } : {},
  });
  return res.data;
}

export async function apiGetItemOptions(itemId: number): Promise<ItemOptionResponse[]> {
  const res = await http.get<ItemOptionResponse[]>(`/trade/items/${itemId}/options`);
  return res.data;
}

export async function apiGetConcludedTrades(
  itemId: number,
  optionId?: number | null,
  page = 0,
  size = 20,
): Promise<PageResult<ConcludedTradeResponse>> {
  const res = await http.get(`/trade/items/${itemId}/concluded`, {
    params: { ...(optionId ? { optionId } : {}), page, size },
  });
  return res.data as PageResult<ConcludedTradeResponse>;
}

export async function apiGetPendingSellBids(
  itemId: number,
  optionId?: number | null,
  page = 0,
  size = 20,
): Promise<PageResult<SellBidResponse>> {
  const res = await http.get(`/trade/items/${itemId}/sell-bids`, {
    params: { ...(optionId ? { optionId } : {}), page, size },
  });
  return res.data as PageResult<SellBidResponse>;
}

export async function apiGetPendingBuyBids(
  itemId: number,
  optionId?: number | null,
  page = 0,
  size = 20,
): Promise<PageResult<BuyBidResponse>> {
  const res = await http.get(`/trade/items/${itemId}/buy-bids`, {
    params: { ...(optionId ? { optionId } : {}), page, size },
  });
  return res.data as PageResult<BuyBidResponse>;
}

export async function apiGetPriceHistory(
  itemId: number,
  range: string,
  optionId?: number | null,
): Promise<PriceHistoryPoint[]> {
  const res = await http.get<PriceHistoryPoint[]>(`/trade/items/${itemId}/price-history`, {
    params: { range, ...(optionId ? { optionId } : {}) },
  });
  return res.data;
}

export async function apiPlaceBuyBid(
  itemId: number,
  price: number,
  itemOptionId?: number | null,
): Promise<PlaceBidResult> {
  const res = await http.post<PlaceBidResult>(`/trade/buy-bids`, {
    itemId,
    price,
    itemOptionId: itemOptionId ?? null,
  });
  return res.data;
}

export async function apiVerifyAndPlaceBuyBid(
  paymentId: string,
  itemId: number,
  price: number,
  itemOptionId?: number | null,
): Promise<PlaceBidResult> {
  const res = await http.post<PlaceBidResult>(`/trade/buy-bids/verify`, {
    paymentId,
    itemId,
    price,
    itemOptionId: itemOptionId ?? null,
  });
  return res.data;
}

export async function apiPlaceSellBid(
  itemId: number,
  price: number,
  itemOptionId?: number | null,
): Promise<PlaceBidResult> {
  const res = await http.post<PlaceBidResult>(`/trade/sell-bids`, {
    itemId,
    price,
    itemOptionId: itemOptionId ?? null,
  });
  return res.data;
}

export async function apiGetMyBuyBids(page = 0, size = 20): Promise<PageResult<BuyBidResponse>> {
  const res = await http.get(`/trade/my/buy-bids`, { params: { page, size } });
  return res.data as PageResult<BuyBidResponse>;
}

export async function apiGetMySellBids(page = 0, size = 20): Promise<PageResult<SellBidResponse>> {
  const res = await http.get(`/trade/my/sell-bids`, { params: { page, size } });
  return res.data as PageResult<SellBidResponse>;
}

export async function apiGetMyConcludedBuyTrades(page = 0, size = 20): Promise<PageResult<ConcludedTradeResponse>> {
  const res = await http.get(`/trade/my/concluded/buy`, { params: { page, size } });
  return res.data as PageResult<ConcludedTradeResponse>;
}

export async function apiGetMyConcludedSellTrades(page = 0, size = 20): Promise<PageResult<ConcludedTradeResponse>> {
  const res = await http.get(`/trade/my/concluded/sell`, { params: { page, size } });
  return res.data as PageResult<ConcludedTradeResponse>;
}

export async function apiAdminGetItemOptions(itemId: number): Promise<ItemOptionResponse[]> {
  const res = await http.get<ItemOptionResponse[]>(`/admin/items/${itemId}/options`);
  return res.data;
}

export async function apiAdminCreateItemOption(
  itemId: number,
  optionValue: string,
  quantity = 1,
  sortOrder?: number,
  sourceTagId?: number | null,
): Promise<ItemOptionResponse> {
  const res = await http.post<ItemOptionResponse>(`/admin/items/${itemId}/options`, {
    optionValue,
    quantity,
    sortOrder: sortOrder ?? 0,
    sourceTagId: sourceTagId ?? null,
  });
  return res.data;
}

export async function apiAdminDeleteItemOption(itemId: number, optionId: number): Promise<void> {
  await http.delete(`/admin/items/${itemId}/options/${optionId}`);
}

// ── 어드민 거래 조회 API ──────────────────────────────────────────

export type AdminConcludedTradeRow = {
  id: number;
  tradeNo: string;
  itemId: number;
  itemName: string;
  brandName: string;
  optionValue: string | null;
  tradePrice: number;
  buyerEmail: string;
  buyerName: string;
  sellerEmail: string;
  sellerName: string;
  courier: string | null;
  trackingNumber: string | null;
  createdAt: string;
};

export type AdminBuyBidRow = {
  id: number;
  itemId: number;
  itemName: string;
  brandName: string;
  optionValue: string | null;
  price: number;
  status: string;
  buyerEmail: string;
  buyerName: string;
  createdAt: string;
};

export type AdminSellBidRow = {
  id: number;
  itemId: number;
  itemName: string;
  brandName: string;
  optionValue: string | null;
  price: number;
  status: string;
  sellerEmail: string;
  sellerName: string;
  createdAt: string;
};

export async function apiGetAdminConcludedTrades(page = 0, size = 20, keyword?: string): Promise<PageResult<AdminConcludedTradeRow>> {
  const res = await http.get(`/admin/trades/concluded`, { params: { page, size, keyword } });
  return res.data as PageResult<AdminConcludedTradeRow>;
}

export async function apiGetAdminBuyBids(page = 0, size = 20, status?: string): Promise<PageResult<AdminBuyBidRow>> {
  const res = await http.get(`/admin/trades/buy-bids`, { params: { page, size, status } });
  return res.data as PageResult<AdminBuyBidRow>;
}

export async function apiGetAdminSellBids(page = 0, size = 20, status?: string): Promise<PageResult<AdminSellBidRow>> {
  const res = await http.get(`/admin/trades/sell-bids`, { params: { page, size, status } });
  return res.data as PageResult<AdminSellBidRow>;
}

export async function apiCancelBuyBid(bidId: number): Promise<void> {
  await http.delete(`/trade/buy-bids/${bidId}`);
}

export async function apiCancelSellBid(bidId: number): Promise<void> {
  await http.delete(`/trade/sell-bids/${bidId}`);
}
