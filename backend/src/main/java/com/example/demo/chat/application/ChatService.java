package com.example.demo.chat.application;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.chat.domain.*;
import com.example.demo.chat.dto.ChatDtos;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import com.example.demo.member.domain.MemberStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageReportRepository chatMessageReportRepository;
    private final MemberRepository memberRepository;
    private final ItemRepository itemRepository;

    /** 1:1 문의방: 해당 유저 전용 채널 조회 또는 생성 */
    @Transactional
    public ChatDtos.ChatRoomResponse getOrCreateDirectRoom(String userEmail) {
        Member member = memberRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ChatRoom room = chatRoomRepository.findByTypeAndUserId(ChatRoomType.DIRECT, member.getId())
                .orElseGet(() -> {
                    String displayName = (member.getNickname() != null && !member.getNickname().isBlank())
                            ? member.getNickname() : member.getName();
                    ChatRoom newRoom = new ChatRoom();
                    newRoom.setType(ChatRoomType.DIRECT);
                    newRoom.setName(displayName + " 님의 문의");
                    newRoom.setUserId(member.getId());
                    return chatRoomRepository.save(newRoom);
                });
        return toChatRoomResponse(room);
    }

    /** 아이템별 단체채팅방: 조회 또는 생성 */
    @Transactional
    public ChatDtos.ChatRoomResponse getOrCreateGroupRoom(Long itemId) {
        ChatRoom room = chatRoomRepository.findByTypeAndItemId(ChatRoomType.GROUP, itemId)
                .orElseGet(() -> {
                    Item item = itemRepository.findById(itemId)
                            .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));
                    ChatRoom newRoom = new ChatRoom();
                    newRoom.setType(ChatRoomType.GROUP);
                    newRoom.setName(item.getName() + " 채팅방");
                    newRoom.setItemId(itemId);
                    return chatRoomRepository.save(newRoom);
                });
        return toChatRoomResponse(room);
    }

    /** 단체채팅방 목록 조회 */
    @Transactional(readOnly = true)
    public List<ChatDtos.ChatRoomResponse> getAllGroupRooms() {
        return chatRoomRepository.findByTypeOrderByCreatedAtDesc(ChatRoomType.GROUP)
                .stream().map(this::toChatRoomResponse).toList();
    }

    /** 사용자가 이름으로 단체채팅방 생성 */
    @Transactional
    public ChatDtos.ChatRoomResponse createGroupRoom(String name) {
        ChatRoom newRoom = new ChatRoom();
        newRoom.setType(ChatRoomType.GROUP);
        newRoom.setName(name.trim());
        return toChatRoomResponse(chatRoomRepository.save(newRoom));
    }

    /** 메시지 저장 */
    @Transactional
    public ChatDtos.ChatMessageResponse saveMessage(Long roomId, Long senderId, String senderName, String content) {
        if (!chatRoomRepository.existsById(roomId)) {
            throw new IllegalArgumentException("채팅방을 찾을 수 없습니다.");
        }
        ChatMessage msg = new ChatMessage();
        msg.setRoomId(roomId);
        msg.setSenderId(senderId);
        msg.setSenderName(senderName);
        msg.setContent(content);
        ChatMessage saved = chatMessageRepository.save(msg);
        return toMessageResponse(saved);
    }

    /** 최근 메시지 (오래된 순) */
    @Transactional(readOnly = true)
    public List<ChatDtos.ChatMessageResponse> getRecentMessages(Long roomId) {
        List<ChatMessage> recentMessages = chatMessageRepository.findTop50ByRoomIdOrderByCreatedAtDesc(roomId);
        Collections.reverse(recentMessages);
        return recentMessages.stream().map(this::toMessageResponse).toList();
    }

    /** 관리자: 전체 채팅방 목록 */
    @Transactional(readOnly = true)
    public List<ChatDtos.AdminRoomListResponse> getAllRoomsForAdmin() {
        List<ChatRoom> rooms = chatRoomRepository.findAllByOrderByCreatedAtDesc();
        return rooms.stream().map(room -> {
            ChatMessage lastMsg = chatMessageRepository.findTopByRoomIdOrderByCreatedAtDesc(room.getId());
            return new ChatDtos.AdminRoomListResponse(
                    room.getId(),
                    room.getType().name(),
                    room.getName(),
                    room.getItemId(),
                    room.getUserId(),
                    lastMsg != null ? lastMsg.getContent() : null,
                    lastMsg != null ? ApiDateTimeConverter.toUtcString(lastMsg.getCreatedAt()) : null
            );
        }).toList();
    }

    /** 메시지 신고 */
    @Transactional
    public ChatDtos.MessageReportResponse reportMessage(Long messageId, String reporterEmail, String reason) {
        if (chatMessageReportRepository.existsByMessageIdAndReporterEmail(messageId, reporterEmail)) {
            throw new IllegalStateException("이미 신고한 메시지입니다.");
        }
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("메시지를 찾을 수 없습니다."));

        ChatMessageReport report = new ChatMessageReport();
        report.setMessageId(messageId);
        report.setRoomId(msg.getRoomId());
        report.setReporterEmail(reporterEmail);
        report.setSenderId(msg.getSenderId());
        report.setSenderName(msg.getSenderName());
        report.setMessageContent(msg.getContent());
        report.setReason(reason);

        return toReportResponse(chatMessageReportRepository.save(report));
    }

    /** 관리자: 신고 목록 조회 */
    @Transactional(readOnly = true)
    public List<ChatDtos.MessageReportResponse> getAdminReports() {
        return chatMessageReportRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toReportResponse).toList();
    }

    /** 관리자: 신고 처리 (BAN | WITHDRAW | DISMISS) */
    @Transactional
    public ChatDtos.MessageReportResponse handleReport(Long reportId, String action, String note) {
        ChatMessageReport report = chatMessageReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));

        if (report.getSenderId() != null && !"DISMISS".equalsIgnoreCase(action)) {
            memberRepository.findById(report.getSenderId()).ifPresent(member -> {
                if ("BAN".equalsIgnoreCase(action)) {
                    member.setStatus(MemberStatus.BLOCKED);
                } else if ("WITHDRAW".equalsIgnoreCase(action)) {
                    member.setStatus(MemberStatus.WITHDRAWN);
                }
            });
        }

        report.setStatus("HANDLED");
        report.setHandledNote(note);
        return toReportResponse(chatMessageReportRepository.save(report));
    }

    // ─── private helpers ──────────────────────────────────────────────────────

    private ChatDtos.ChatRoomResponse toChatRoomResponse(ChatRoom room) {
        return new ChatDtos.ChatRoomResponse(
                room.getId(), room.getType().name(), room.getName(),
                room.getItemId(), room.getUserId(),
                ApiDateTimeConverter.toUtcString(room.getCreatedAt())
        );
    }

    private ChatDtos.ChatMessageResponse toMessageResponse(ChatMessage msg) {
        return new ChatDtos.ChatMessageResponse(
                msg.getId(), msg.getRoomId(), msg.getSenderId(), msg.getSenderName(),
                msg.getContent(), ApiDateTimeConverter.toUtcString(msg.getCreatedAt())
        );
    }

    private ChatDtos.MessageReportResponse toReportResponse(ChatMessageReport r) {
        return new ChatDtos.MessageReportResponse(
                r.getId(), r.getMessageId(), r.getRoomId(),
                r.getReporterEmail(), r.getSenderId(), r.getSenderName(),
                r.getMessageContent(), r.getReason(), r.getStatus(),
                r.getHandledNote(),
                ApiDateTimeConverter.toUtcString(r.getCreatedAt())
        );
    }
}
