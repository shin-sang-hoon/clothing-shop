package com.example.demo.chat.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId);
    List<ChatMessage> findTop50ByRoomIdOrderByCreatedAtDesc(Long roomId);

    // 마지막 메시지 1건
    ChatMessage findTopByRoomIdOrderByCreatedAtDesc(Long roomId);
}
