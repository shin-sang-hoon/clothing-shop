import { http } from "./http";

export type ChatRoomResponse = {
  id: number;
  type: "DIRECT" | "GROUP";
  name: string;
  itemId?: number | null;
  userId?: number | null;
  createdAt: string;
};

export type ChatMessageResponse = {
  id: number;
  roomId: number;
  senderId?: number | null;
  senderName: string;
  content: string;
  createdAt: string;
};

export type AdminRoomListResponse = {
  id: number;
  type: string;
  name: string;
  itemId?: number | null;
  userId?: number | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
};

export type MessageReportResponse = {
  id: number;
  messageId: number;
  roomId: number;
  reporterEmail: string;
  senderId?: number | null;
  senderName: string;
  messageContent: string;
  reason: string;
  status: "PENDING" | "HANDLED" | "DISMISSED";
  handledNote?: string | null;
  createdAt: string;
};

/** 내 1:1 문의 채팅방 조회/생성 */
export async function apiGetDirectRoom(): Promise<ChatRoomResponse> {
  const res = await http.get<ChatRoomResponse>("/chat/rooms/direct");
  return res.data;
}

/** 아이템별 단체 채팅방 조회/생성 */
export async function apiGetGroupRoom(itemId: number): Promise<ChatRoomResponse> {
  const res = await http.get<ChatRoomResponse>("/chat/rooms/group", { params: { itemId } });
  return res.data;
}

/** 전체 단체 채팅방 목록 */
export async function apiGetGroupRooms(): Promise<ChatRoomResponse[]> {
  const res = await http.get<ChatRoomResponse[]>("/chat/rooms/group/list");
  return res.data;
}

/** 단체 채팅방 생성 */
export async function apiCreateGroupRoom(name: string): Promise<ChatRoomResponse> {
  const res = await http.post<ChatRoomResponse>("/chat/rooms/group", { name });
  return res.data;
}

/** 채팅방 메시지 히스토리 */
export async function apiGetChatMessages(roomId: number): Promise<ChatMessageResponse[]> {
  const res = await http.get<ChatMessageResponse[]>(`/chat/rooms/${roomId}/messages`);
  return res.data;
}

/** 메시지 신고 */
export async function apiReportMessage(messageId: number, reason: string): Promise<MessageReportResponse> {
  const res = await http.post<MessageReportResponse>(`/chat/messages/${messageId}/report`, { reason });
  return res.data;
}

/** 관리자: 전체 채팅방 */
export async function apiGetAdminChatRooms(): Promise<AdminRoomListResponse[]> {
  const res = await http.get<AdminRoomListResponse[]>("/admin/chat/rooms");
  return res.data;
}

/** 관리자: 신고 목록 */
export async function apiGetAdminReports(): Promise<MessageReportResponse[]> {
  const res = await http.get<MessageReportResponse[]>("/admin/chat/reports");
  return res.data;
}

/** 거래 체결 후 구매자-판매자 1:1 채팅방 조회/생성 */
export async function apiGetOrCreateTradeRoom(tradeId: number): Promise<ChatRoomResponse> {
  const res = await http.post<ChatRoomResponse>("/chat/rooms/trade", { tradeId });
  return res.data;
}

/** 거래 채팅방 목록 (내가 참여한 거래 채팅) */
export async function apiGetMyTradeRooms(): Promise<ChatRoomResponse[]> {
  const res = await http.get<ChatRoomResponse[]>("/chat/rooms/trade/my");
  return res.data;
}

/** 관리자: 신고 처리 */
export async function apiHandleReport(
  reportId: number,
  action: "BAN" | "WITHDRAW" | "DISMISS",
  note: string,
): Promise<MessageReportResponse> {
  const res = await http.patch<MessageReportResponse>(`/admin/chat/reports/${reportId}/handle`, {
    action,
    note,
  });
  return res.data;
}
