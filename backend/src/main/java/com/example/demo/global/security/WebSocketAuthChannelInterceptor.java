package com.example.demo.global.security;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * WebSocketAuthChannelInterceptor
 * - STOMP CONNECT 프레임의 Authorization 헤더에서 JWT를 파싱하여 Principal 설정
 */
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final MemberAuthorityResolver memberAuthorityResolver;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7).trim();
                try {
                    JwtUtil.JwtPayload payload = jwtUtil.verifyAndParse(token);
                    MemberAuthorityResolver.ResolvedMember resolved =
                            memberAuthorityResolver.resolveActiveMember(payload.memberId());
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    resolved.email(), null, resolved.authorities());
                    accessor.setUser(auth);
                } catch (Exception ignored) {
                    // 토큰이 유효하지 않으면 익명으로 처리
                }
            }
        }
        return message;
    }
}
