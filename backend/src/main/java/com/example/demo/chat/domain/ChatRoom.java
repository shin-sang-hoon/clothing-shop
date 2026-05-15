package com.example.demo.chat.domain;

import com.example.demo.global.time.ApiDateTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_room", indexes = {
        @Index(name = "idx_chat_room_type_user", columnList = "type, user_id"),
        @Index(name = "idx_chat_room_type_item", columnList = "type, item_id")
})
@Getter @Setter @NoArgsConstructor
public class ChatRoom {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatRoomType type;

    /** 채팅방 이름 (아이템명, 브랜드명, 또는 사용자명) */
    @Column(nullable = false, length = 200)
    private String name;

    /** GROUP: 연결된 아이템 ID */
    @Column(name = "item_id")
    private Long itemId;

    /** DIRECT: 관리자 외 사용자 ID */
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = ApiDateTimeConverter.nowKst();
}
