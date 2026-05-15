package com.example.demo.chat.dto;

public class ChatDtos {

    /** 클라이언트 → 서버: 메시지 전송 */
    public record SendMessageRequest(Long roomId, String content) {}

    /** 서버 → 클라이언트: 메시지 브로드캐스트 */
    public record ChatMessageResponse(
            Long id,
            Long roomId,
            Long senderId,
            String senderName,
            String content,
            String createdAt
    ) {}

    /** 채팅방 정보 */
    public record ChatRoomResponse(
            Long id,
            String type,
            String name,
            Long itemId,
            Long userId,
            String createdAt
    ) {}

    /** 관리자: 채팅방 목록 (마지막 메시지 포함) */
    public record AdminRoomListResponse(
            Long id,
            String type,
            String name,
            Long itemId,
            Long userId,
            String lastMessage,
            String lastMessageAt
    ) {}

    /** 단체채팅방 생성 요청 */
    public record CreateGroupRoomRequest(String name) {}

    /** 메시지 신고 요청 */
    public record ReportMessageRequest(String reason) {}

    /** 신고 내역 응답 */
    public record MessageReportResponse(
            Long id,
            Long messageId,
            Long roomId,
            String reporterEmail,
            Long senderId,
            String senderName,
            String messageContent,
            String reason,
            String status,
            String handledNote,
            String createdAt
    ) {}

    /** 관리자: 신고 처리 요청 (action: BAN | WITHDRAW | DISMISS) */
    public record HandleReportRequest(String action, String note) {}
}
