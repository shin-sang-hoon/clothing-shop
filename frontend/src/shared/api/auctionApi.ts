import { http } from "./http";
import type { PageResponse } from "./common/page";

export type BidResponse = {
    bidId: number;
    bidderEmail: string;
    bidderName: string;
    amount: number;
    bidAt: string;
};

export type AuctionItemResponse = {
    auctionId: number;
    itemId: number;
    itemName: string;
    brandName: string;
    kind: string;
    sellerEmail: string;
    sellerName: string;
    sellerPhone: string;
    winnerEmail?: string | null;
    winnerName?: string | null;
    winnerPhone?: string | null;
    startPrice: number;
    currentBid: number;
    bidCount: number;
    endDate: string;
    status: string;
    sizeInfo?: string | null;
    conditionDesc?: string | null;
    createdAt: string;
    bids: BidResponse[];
};

export type AdminAuctionListRow = {
    auctionId: number;
    orderNo: string;
    sellerEmail: string;
    sellerName: string;
    sellerPhone: string;
    winnerEmail?: string | null;
    winnerName?: string | null;
    winnerPhone?: string | null;
    itemName: string;
    brandName: string;
    startPrice: number;
    currentBid: number;
    bidCount: number;
    endDate: string;
    status: string;
    createdAt: string;
};

export type CreateAuctionRequest = {
    itemId: number;
    startPrice: number;
    endDate: string;
    sizeInfo?: string;
    conditionDesc?: string;
};

export type PlaceBidRequest = {
    amount: number;
};

/** 경매 등록 (판매자) */
export async function apiCreateAuction(req: CreateAuctionRequest): Promise<AuctionItemResponse> {
    const res = await http.post<AuctionItemResponse>("/auctions", req);
    return res.data;
}

/** 입찰 */
export async function apiPlaceBid(auctionId: number, req: PlaceBidRequest): Promise<AuctionItemResponse> {
    const res = await http.post<AuctionItemResponse>(`/auctions/${auctionId}/bids`, req);
    return res.data;
}

/** 내 판매 경매 목록 */
export async function apiGetMySellingAuctions(): Promise<AuctionItemResponse[]> {
    const res = await http.get<AuctionItemResponse[]>("/auctions/my/selling");
    return res.data;
}

/** 내 입찰(구매) 경매 목록 */
export async function apiGetMyBiddingAuctions(): Promise<AuctionItemResponse[]> {
    const res = await http.get<AuctionItemResponse[]>("/auctions/my/bidding");
    return res.data;
}

/** 관리자 경매 목록 */
export async function apiGetAdminAuctions(
    page = 0,
    size = 20,
): Promise<PageResponse<AdminAuctionListRow>> {
    const res = await http.get<PageResponse<AdminAuctionListRow>>("/admin/auctions", {
        params: { page, size },
    });
    return res.data;
}
