package com.example.demo.chat.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message", indexes = {
        @Index(name = "idx_chat_message_room_id", columnList = "room_id"),
        @Index(name = "idx_chat_message_created_at", columnList = "created_at")
})
@Getter @Setter @NoArgsConstructor
public class ChatMessage {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    /** 발신자 ID (null = 시스템 메시지) */
    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "sender_name", length = 100)
    private String senderName;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
