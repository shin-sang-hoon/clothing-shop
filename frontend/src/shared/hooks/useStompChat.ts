import { useEffect, useRef, useState, useCallback } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import type { ChatMessageResponse } from "@/shared/api/chatApi";
import { apiGetChatMessages } from "@/shared/api/chatApi";
import { useAuthStore } from "@/shared/store/authStore";

export function useStompChat(roomId: number | null) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Load history when room changes
  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    apiGetChatMessages(roomId)
      .then(setMessages)
      .catch(() => {});
  }, [roomId]);

  // STOMP connection
  useEffect(() => {
    if (!roomId) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/ws`;

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/room.${roomId}`, (frame: IMessage) => {
          try {
            const msg: ChatMessageResponse = JSON.parse(frame.body);
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          } catch {
            // ignore parse errors
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomId, accessToken]);

  const sendMessage = useCallback(
    (content: string): boolean => {
      const client = clientRef.current;
      if (!client?.connected || !roomId || !content.trim()) return false;
      client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ roomId, content: content.trim() }),
      });
      return true;
    },
    [roomId],
  );

  return { messages, sendMessage, connected };
}
