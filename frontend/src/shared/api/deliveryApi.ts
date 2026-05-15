import { http } from "./http";

export type DeliveryResponse = {
  orderNo: string;
  type: "RENTAL" | "TRADE";
  itemName: string | null;
  optionValue: string | null;
  status: string;
  courier: string | null;
  trackingNumber: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  roadAddress: string | null;
  detailAddress: string | null;
  createdAt: string | null;
  deliveryStatus: string | null;
};

export async function apiGetDelivery(orderNo: string): Promise<DeliveryResponse> {
  const res = await http.get<DeliveryResponse>("/delivery", { params: { orderNo } });
  return res.data;
}

export type AdminRegisterTradeShippingRequest = {
  courier: string;
  trackingNumber: string;
  receiverName?: string;
  receiverPhone?: string;
  zipCode?: string;
  roadAddress?: string;
  detailAddress?: string;
};

export async function apiAdminRegisterTradeShipping(
  tradeId: number,
  req: AdminRegisterTradeShippingRequest
): Promise<void> {
  await http.patch(`/admin/trades/${tradeId}/shipping`, req);
}
