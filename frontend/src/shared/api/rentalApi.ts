import { http } from "./http";
import type { PageResponse } from "./common/page";

export type RentalOrderResponse = {
    rentalId: number;
    orderNo: string;
    itemId: number;
    itemName: string;
    brandName: string;
    sellerEmail: string;
    sellerName: string;
    sellerPhone: string;
    renterEmail: string;
    renterName: string;
    renterPhone: string;
    startDate?: string | null;
    endDate?: string | null;
    rentalPrice: number;
    deposit: number;
    paidAmount?: number | null;
    receiverName: string;
    receiverPhone: string;
    zipCode?: string | null;
    roadAddress?: string | null;
    detailAddress?: string | null;
    sizeInfo?: string | null;
    itemImageUrl?: string | null;
    status: string;
    createdAt: string;
};

export type AdminRentalListRow = {
    rentalId: number;
    orderNo: string;
    renterEmail: string;
    renterName: string;
    renterPhone: string;
    sellerEmail: string;
    sellerName: string;
    sellerPhone: string;
    itemName: string;
    brandName: string;
    receiverName: string;
    receiverPhone: string;
    paidAmount?: number | null;
    status: string;
    deliveryStatus: string;
    createdAt: string;
};

export type CreateRentalRequest = {
    itemId: number;
    itemOptionId?: number;
    sellerId?: number;
    startDate: string;
    endDate: string;
    receiverName: string;
    receiverPhone: string;
    zipCode?: string;
    roadAddress?: string;
    detailAddress?: string;
    sizeInfo?: string;
};

/** 렌탈 주문 등록 */
export async function apiCreateRental(req: CreateRentalRequest): Promise<RentalOrderResponse> {
    const res = await http.post<RentalOrderResponse>("/rentals", req);
    return res.data;
}

/** 포트원 결제 검증 후 렌탈 신청 */
export async function apiVerifyAndCreateRental(req: CreateRentalRequest & { paymentId: string }): Promise<RentalOrderResponse> {
    const res = await http.post<RentalOrderResponse>("/rentals/verify", req);
    return res.data;
}

/** 내가 빌린 렌탈 목록 */
export async function apiGetMyRenting(): Promise<RentalOrderResponse[]> {
    const res = await http.get<RentalOrderResponse[]>("/rentals/my/renting");
    return res.data;
}

/** 내가 빌려준 렌탈 목록 */
export async function apiGetMyLending(): Promise<RentalOrderResponse[]> {
    const res = await http.get<RentalOrderResponse[]>("/rentals/my/lending");
    return res.data;
}

/** 관리자 렌탈 목록 */
export async function apiGetAdminRentals(
    page = 0,
    size = 20,
): Promise<PageResponse<AdminRentalListRow>> {
    const res = await http.get<PageResponse<AdminRentalListRow>>("/admin/rentals", {
        params: { page, size },
    });
    return res.data;
}

export type RentalAvailabilityResponse = {
    optionId: number;
    optionValue: string;
    rentalStatus: "AVAILABLE" | "RENTING" | "INSPECTING" | "WASHING";
    availableForDates: boolean;
};

/** SKU 렌탈 가용성 조회 */
export async function apiGetRentalAvailability(
    itemId: number,
    startDate: string,
    endDate: string,
): Promise<RentalAvailabilityResponse[]> {
    const res = await http.get<RentalAvailabilityResponse[]>(
        `/items/${itemId}/options/availability`,
        { params: { startDate, endDate } },
    );
    return res.data;
}

/** 관리자: 렌탈 상태 변경 */
export async function apiAdminUpdateRentalStatus(
    rentalId: number,
    status: string,
): Promise<RentalOrderResponse> {
    const res = await http.patch<RentalOrderResponse>(`/admin/rentals/${rentalId}/status`, { status });
    return res.data;
}

/** 관리자: 배송 진행 상태 변경 */
export async function apiAdminUpdateDeliveryStatus(
    rentalId: number,
    deliveryStatus: string,
): Promise<void> {
    await http.patch(`/admin/rentals/${rentalId}/delivery-status`, { deliveryStatus });
}

/** 관리자: 배송 정보 등록 */
export async function apiAdminRegisterShipping(
    rentalId: number,
    courier: string,
    trackingNumber: string,
): Promise<RentalOrderResponse> {
    const res = await http.patch<RentalOrderResponse>(`/admin/rentals/${rentalId}/shipping`, {
        courier,
        trackingNumber,
    });
    return res.data;
}
