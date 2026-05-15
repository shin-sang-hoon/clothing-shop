package com.example.demo.chat.api;

import com.example.demo.chat.application.ChatService;
import com.example.demo.chat.dto.ChatDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /** 내 1:1 문의 채팅방 조회/생성 */
    @GetMapping("/api/chat/rooms/direct")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatDtos.ChatRoomResponse> getDirectRoom(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(chatService.getOrCreateDirectRoom(email));
    }

    /** 아이템별 단체 채팅방 조회/생성 */
    @GetMapping("/api/chat/rooms/group")
    public ResponseEntity<ChatDtos.ChatRoomResponse> getGroupRoom(@RequestParam Long itemId) {
        return ResponseEntity.ok(chatService.getOrCreateGroupRoom(itemId));
    }

    /** 전체 단체 채팅방 목록 */
    @GetMapping("/api/chat/rooms/group/list")
    public ResponseEntity<List<ChatDtos.ChatRoomResponse>> listGroupRooms() {
        return ResponseEntity.ok(chatService.getAllGroupRooms());
    }

    /** 단체 채팅방 생성 */
    @PostMapping("/api/chat/rooms/group")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatDtos.ChatRoomResponse> createGroupRoom(
            @RequestBody ChatDtos.CreateGroupRoomRequest req) {
        return ResponseEntity.ok(chatService.createGroupRoom(req.name()));
    }

    /** 채팅방 메시지 히스토리 */
    @GetMapping("/api/chat/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatDtos.ChatMessageResponse>> getMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getRecentMessages(roomId));
    }

    /** 메시지 신고 */
    @PostMapping("/api/chat/messages/{messageId}/report")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatDtos.MessageReportResponse> reportMessage(
            @PathVariable Long messageId,
            @RequestBody ChatDtos.ReportMessageRequest req,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(chatService.reportMessage(messageId, email, req.reason()));
    }

    /** 관리자: 전체 채팅방 목록 */
    @GetMapping("/api/admin/chat/rooms")
    @PreAuthorize("hasAuthority('PERM_ADMIN_PORTAL_ACCESS')")
    public ResponseEntity<List<ChatDtos.AdminRoomListResponse>> getAdminRooms() {
        return ResponseEntity.ok(chatService.getAllRoomsForAdmin());
    }

    /** 관리자: 신고 목록 */
    @GetMapping("/api/admin/chat/reports")
    @PreAuthorize("hasAuthority('PERM_ADMIN_PORTAL_ACCESS')")
    public ResponseEntity<List<ChatDtos.MessageReportResponse>> getAdminReports() {
        return ResponseEntity.ok(chatService.getAdminReports());
    }

    /** 관리자: 신고 처리 */
    @PatchMapping("/api/admin/chat/reports/{reportId}/handle")
    @PreAuthorize("hasAuthority('PERM_ADMIN_PORTAL_ACCESS')")
    public ResponseEntity<ChatDtos.MessageReportResponse> handleReport(
            @PathVariable Long reportId,
            @RequestBody ChatDtos.HandleReportRequest req) {
        return ResponseEntity.ok(chatService.handleReport(reportId, req.action(), req.note()));
    }
}
