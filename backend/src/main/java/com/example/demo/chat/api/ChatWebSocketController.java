package com.example.demo.chat.api;

import com.example.demo.chat.application.ChatService;
import com.example.demo.chat.dto.ChatDtos;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MemberRepository memberRepository;

    /**
     * 메시지 수신 → DB 저장 → 해당 방 구독자에게 브로드캐스트
     * Client destination: /app/chat.send
     * Broadcast to: /topic/room.{roomId}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatDtos.SendMessageRequest req, Principal principal) {
        Long senderId = null;
        String senderName = "익명";

        if (principal != null) {
            Optional<Member> opt = memberRepository.findByEmail(principal.getName());
            if (opt.isPresent()) {
                Member m = opt.get();
                senderId = m.getId();
                String nick = m.getNickname();
                senderName = (nick != null && !nick.isBlank()) ? nick : m.getName();
            }
        }

        ChatDtos.ChatMessageResponse response = chatService.saveMessage(
                req.roomId(), senderId, senderName, req.content()
        );

        messagingTemplate.convertAndSend("/topic/room." + req.roomId(), response);
    }
}
