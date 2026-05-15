package com.example.demo.chat.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByTypeAndUserId(ChatRoomType type, Long userId);
    Optional<ChatRoom> findByTypeAndItemId(ChatRoomType type, Long itemId);
    List<ChatRoom> findByTypeOrderByCreatedAtDesc(ChatRoomType type);
    List<ChatRoom> findAllByOrderByCreatedAtDesc();

    @Query("""
            SELECT
                r.id AS roomId,
                r.type AS roomType,
                r.name AS roomName,
                r.itemId AS itemId,
                r.userId AS userId,
                m.content AS lastMessage,
                m.createdAt AS lastMessageCreatedAt
            FROM ChatRoom r
            LEFT JOIN ChatMessage m
                ON m.id = (
                    SELECT MAX(m2.id)
                    FROM ChatMessage m2
                    WHERE m2.roomId = r.id
                )
            ORDER BY r.createdAt DESC
            """)
    List<AdminRoomWithLastMessageRow> findAllRoomsWithLastMessage();

    interface AdminRoomWithLastMessageRow {
        Long getRoomId();
        ChatRoomType getRoomType();
        String getRoomName();
        Long getItemId();
        Long getUserId();
        String getLastMessage();
        LocalDateTime getLastMessageCreatedAt();
    }
}
