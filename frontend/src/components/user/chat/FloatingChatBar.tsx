import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FloatingChatBar.module.css";
import { useStompChat } from "@/shared/hooks/useStompChat";
import {
  apiGetDirectRoom,
  apiGetGroupRooms,
  apiCreateGroupRoom,
  apiReportMessage,
  apiGetMyTradeRooms,
  type ChatRoomResponse,
} from "@/shared/api/chatApi";
import { useAuthStore } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";
import { useNotificationStore } from "@/shared/store/notificationStore";
import { http } from "@/shared/api/http";

type PopupType = "direct" | "group" | "trade" | "ai" | null;
type GroupView = "list" | "chat";

const AI_CATEGORY_BTNS = [
  { label: "🛒 렌탈 신청",   query: "렌탈 신청은 어떻게 하나요?" },
  { label: "↗ 입찰 참여",   query: "경매 참여하려면 어떻게 해요?" },
  { label: "🚚 배송",         query: "배송은 보통 며칠 걸리나요?" },
  { label: "🔄 취소·교환",   query: "주문 취소는 언제까지 가능한가요?" },
  { label: "📦 상품 문의",   query: "상품 문의" },
  { label: "💳 주문·결제",   query: "어떤 결제 수단을 쓸 수 있나요?" },
  { label: "👤 회원 정보",   query: "회원가입은 무료인가요?" },
  { label: "📞 상담원 연결", query: "AGENT" },
];

interface AiButton {
  label: string;
  query: string;
}

interface AiMessage {
  id: number;
  sender: "me" | "ai";
  text: string;
  format?: "text" | "html";
  buttons?: AiButton[];
  buttonStyle?: string;
  time: string;
}

function nowStr() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatMsgTime(createdAt: string): string {
  try {
    return new Date(createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function FloatingChatBar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState<PopupType>(null);
  const me = useAuthStore((s) => s.me);
  const setMe = useAuthStore((s) => s.setMe);
  const openAlert = useModalStore((s) => s.openAlert);
  const pushNotification = useNotificationStore((s) => s.push);

  // Direct room state
  const [directRoomId, setDirectRoomId] = useState<number | null>(null);
  const [directRoomLoading, setDirectRoomLoading] = useState(false);
  const [directRoomError, setDirectRoomError] = useState(false);
  const [directInput, setDirectInput] = useState("");

  // Group chat state
  const [groupView, setGroupView] = useState<GroupView>("list");
  const [groupRooms, setGroupRooms] = useState<ChatRoomResponse[]>([]);
  const [groupRoomLoading, setGroupRoomLoading] = useState(false);
  const [selectedGroupRoom, setSelectedGroupRoom] = useState<ChatRoomResponse | null>(null);
  const [groupInput, setGroupInput] = useState("");

  // Trade chat state
  const [tradeView, setTradeView] = useState<GroupView>("list");
  const [tradeRooms, setTradeRooms] = useState<ChatRoomResponse[]>([]);
  const [tradeRoomLoading, setTradeRoomLoading] = useState(false);
  const [selectedTradeRoom, setSelectedTradeRoom] = useState<ChatRoomResponse | null>(null);
  const [tradeInput, setTradeInput] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Nickname setup
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const [pendingChatType, setPendingChatType] = useState<PopupType>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  // Report
  const [reportingMsgId, setReportingMsgId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");

  // AI chat state
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOnline, setAiOnline] = useState(false);
  const [aiAvgResponseMs, setAiAvgResponseMs] = useState<number | null>(null);

  // STOMP hooks
  const { messages: directMessages, sendMessage: sendDirect, connected: directConnected } =
    useStompChat(directRoomId);
  const { messages: groupMessages, sendMessage: sendGroup, connected: groupConnected } =
    useStompChat(selectedGroupRoom?.id ?? null);
  const { messages: tradeMessages, sendMessage: sendTrade, connected: tradeConnected } =
    useStompChat(selectedTradeRoom?.id ?? null);

  // Scroll refs
  const directScrollRef = useRef<HTMLDivElement>(null);
  const groupScrollRef = useRef<HTMLDivElement>(null);
  const tradeScrollRef = useRef<HTMLDivElement>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (directScrollRef.current)
      directScrollRef.current.scrollTop = directScrollRef.current.scrollHeight;
  }, [directMessages]);

  useEffect(() => {
    if (groupScrollRef.current)
      groupScrollRef.current.scrollTop = groupScrollRef.current.scrollHeight;
  }, [groupMessages]);

  useEffect(() => {
    if (tradeScrollRef.current)
      tradeScrollRef.current.scrollTop = tradeScrollRef.current.scrollHeight;
  }, [tradeMessages]);

  useEffect(() => {
    if (aiScrollRef.current)
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

  // 채팅 알림: 팝업이 닫혀 있을 때 다른 사람의 메시지가 오면 알림 push
  useEffect(() => {
    if (directMessages.length === 0) return;
    const last = directMessages[directMessages.length - 1];
    if (open === "direct") return;
    if (me?.id != null && last.senderId === me.id) return;
    pushNotification({ type: "info", title: "관리자 답변", message: last.content });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directMessages]);

  useEffect(() => {
    if (groupMessages.length === 0) return;
    const last = groupMessages[groupMessages.length - 1];
    if (open === "group") return;
    if (me?.id != null && last.senderId === me.id) return;
    const roomName = selectedGroupRoom?.name ?? "단체채팅";
    pushNotification({ type: "info", title: `[${roomName}] 새 메시지`, message: last.content });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupMessages]);

  useEffect(() => {
    if (tradeMessages.length === 0) return;
    const last = tradeMessages[tradeMessages.length - 1];
    if (open === "trade") return;
    if (me?.id != null && last.senderId === me.id) return;
    const roomName = selectedTradeRoom?.name ?? "거래채팅";
    pushNotification({ type: "info", title: `[${roomName}] 새 메시지`, message: last.content });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeMessages]);

  // AI 챗봇 헬스체크 (팝업 열릴 때 + 30초 주기)
  useEffect(() => {
    if (open !== "ai") return;

    async function checkHealth() {
      try {
        const res = await fetch("/chatbot/health");
        if (res.ok) {
          setAiOnline(true);
          setAiMessages((prev) => {
            if (prev.length > 0) return prev;
            return [{ id: Date.now(), sender: "ai", text: "안녕하세요! 무림 상담봇 \"무림이\"입니다 😊\n상품 문의, 렌탈 신청, 입찰 참여, 배송 문의 등 무엇이든 질문해 주세요!", format: "text", time: nowStr() }];
          });
        } else {
          setAiOnline(false);
          setAiMessages((prev) => {
            if (prev.length > 0) return prev;
            return [{ id: Date.now(), sender: "ai", text: "지금은 상담시간이 아닙니다.", format: "text", time: nowStr() }];
          });
        }
      } catch {
        setAiOnline(false);
        setAiMessages((prev) => {
          if (prev.length > 0) return prev;
          return [{ id: Date.now(), sender: "ai", text: "지금은 상담시간이 아닙니다.", format: "text", time: nowStr() }];
        });
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [open]);

  function openChat(type: PopupType) {
    if (type !== "ai") {
      if (!me) {
        openAlert("warning", "로그인 필요", "채팅 기능은 로그인 후 이용 가능합니다.");
        setMenuOpen(false);
        return;
      }
      if (!me.nickname) {
        setPendingChatType(type);
        setShowNicknameSetup(true);
        setMenuOpen(false);
        return;
      }
    }
    setOpen(type);
    setMenuOpen(false);

    if (type === "direct" && directRoomId === null && !directRoomLoading) {
      setDirectRoomError(false);
      setDirectRoomLoading(true);
      apiGetDirectRoom()
        .then((room) => setDirectRoomId(room.id))
        .catch(() => setDirectRoomError(true))
        .finally(() => setDirectRoomLoading(false));
    }

    if (type === "group") {
      loadGroupRooms();
    }

    if (type === "trade") {
      loadTradeRooms();
    }
  }

  function loadTradeRooms() {
    setTradeRoomLoading(true);
    apiGetMyTradeRooms()
      .then(setTradeRooms)
      .catch(() => {})
      .finally(() => setTradeRoomLoading(false));
  }

  function loadGroupRooms() {
    setGroupRoomLoading(true);
    apiGetGroupRooms()
      .then(setGroupRooms)
      .catch(() => {})
      .finally(() => setGroupRoomLoading(false));
  }

  function enterGroupRoom(room: ChatRoomResponse) {
    setSelectedGroupRoom(room);
    setGroupView("chat");
  }

  function handleCreateRoom() {
    if (!newRoomName.trim()) return;
    setCreatingRoom(true);
    apiCreateGroupRoom(newRoomName.trim())
      .then((room) => {
        setGroupRooms((prev) => [room, ...prev]);
        setNewRoomName("");
        setShowCreateForm(false);
        enterGroupRoom(room);
      })
      .catch(() => {})
      .finally(() => setCreatingRoom(false));
  }

  function handleSendDirect() {
    if (!directInput.trim()) return;
    sendDirect(directInput.trim());
    setDirectInput("");
  }

  function handleSendGroup() {
    if (!groupInput.trim()) return;
    sendGroup(groupInput.trim());
    setGroupInput("");
  }

  function handleSendTrade() {
    if (!tradeInput.trim()) return;
    sendTrade(tradeInput.trim());
    setTradeInput("");
  }

  async function callChatbot(question: string) {
    setAiLoading(true);
    const t0 = performance.now();
    try {
      const res = await fetch("/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const ms = performance.now() - t0;
      setAiAvgResponseMs((prev) => (prev === null ? Math.round(ms) : Math.round((prev + ms) / 2)));
      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: data.answer ?? "",
          format: data.answer_format ?? "text",
          buttons: data.buttons ?? [],
          buttonStyle: data.button_style ?? "",
          time: nowStr(),
        },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "ai", text: "AI 챗봇 서버에 연결할 수 없습니다.", format: "text", time: nowStr() },
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  async function sendAi() {
    if (!aiInput.trim() || aiLoading) return;
    const question = aiInput.trim();
    setAiMessages((prev) => [...prev, { id: Date.now(), sender: "me", text: question, format: "text", time: nowStr() }]);
    setAiInput("");
    await callChatbot(question);
  }

  async function sendAiButton(query: string) {
    if (aiLoading) return;
    if (query === "AGENT") {
      openChat("direct");
      return;
    }
    setAiMessages((prev) => [...prev, { id: Date.now(), sender: "me", text: query, format: "text", time: nowStr() }]);
    await callChatbot(query);
  }

  async function sendAiCategoryBtn(label: string, query: string) {
    if (aiLoading) return;
    if (!aiOnline) {
      setAiMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "me", text: label, format: "text", time: nowStr() },
        { id: Date.now() + 1, sender: "ai", text: "지금은 상담시간이 아닙니다.", format: "text", time: nowStr() },
      ]);
      return;
    }
    if (query === "AGENT") {
      openChat("direct");
      return;
    }
    setAiMessages((prev) => [...prev, { id: Date.now(), sender: "me", text: label, format: "text", time: nowStr() }]);
    await callChatbot(query);
  }

  async function handleSaveNickname() {
    const trimmed = nicknameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      openAlert("warning", "닉네임 오류", "닉네임은 2자 이상 20자 이하로 입력해주세요.");
      return;
    }
    setSavingNickname(true);
    try {
      await http.patch("/me/nickname", { nickname: trimmed });
      if (me) setMe({ ...me, nickname: trimmed });
      setShowNicknameSetup(false);
      setNicknameInput("");
      if (pendingChatType) {
        setOpen(pendingChatType);
        if (pendingChatType === "direct" && directRoomId === null && !directRoomLoading) {
          setDirectRoomError(false);
          setDirectRoomLoading(true);
          apiGetDirectRoom()
            .then((room) => setDirectRoomId(room.id))
            .catch(() => setDirectRoomError(true))
            .finally(() => setDirectRoomLoading(false));
        }
        if (pendingChatType === "group") loadGroupRooms();
        setPendingChatType(null);
      }
    } catch {
      openAlert("error", "저장 실패", "닉네임 저장에 실패했습니다.");
    } finally {
      setSavingNickname(false);
    }
  }

  function submitReport() {
    if (!reportingMsgId || !reportReason.trim()) return;
    apiReportMessage(reportingMsgId, reportReason.trim())
      .then(() => {
        setReportingMsgId(null);
        setReportReason("");
        openAlert("success", "신고 접수", "신고가 접수되었습니다.");
      })
      .catch(() => openAlert("error", "오류", "신고 중 오류가 발생했습니다."));
  }

  const myName = me?.name ?? "";

  return (
    <>
    {/* AI 챗봇 팝업 — 화면 정중앙 (container 밖) */}
    {(open === "direct" || open === "group" || open === "trade") && (
      <div className={styles.chatBackdrop} onClick={() => setOpen(null)} />
    )}

    {/* 관리자 문의 팝업 — 화면 정중앙 */}
    {open === "direct" && (
      <div className={styles.centeredPopup}>
        <div className={styles.popupHeader}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            관리자 문의
            {directConnected && <span className={styles.connectedBadge}>연결됨</span>}
          </span>
          <button className={styles.closeBtn} onClick={() => setOpen(null)}>✕</button>
        </div>
        <div className={styles.messages} ref={directScrollRef}>
          {directRoomLoading && (
            <div className={styles.loadingHint}>채팅방 연결 중...</div>
          )}
          {directRoomError && !directRoomLoading && (
            <div className={styles.loadingHint} style={{ color: "#e65c00" }}>
              채팅방을 불러오지 못했습니다.{" "}
              <button
                style={{ background: "none", border: "none", color: "#e65c00", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                onClick={() => {
                  setDirectRoomError(false);
                  setDirectRoomLoading(true);
                  apiGetDirectRoom()
                    .then((room) => setDirectRoomId(room.id))
                    .catch(() => setDirectRoomError(true))
                    .finally(() => setDirectRoomLoading(false));
                }}
              >다시 시도</button>
            </div>
          )}
          {directMessages.length === 0 && !directRoomLoading && !directRoomError && (
            <div className={styles.loadingHint}>메시지가 없습니다. 문의를 시작해 보세요.</div>
          )}
          {directMessages.map((m) => {
            const isMe = m.senderName === myName || (me?.id != null && m.senderId === me.id);
            return (
              <div key={m.id} className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""}`}>
                {!isMe && m.senderName && (
                  <div className={styles.senderName}>{m.senderName}</div>
                )}
                <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : ""}`}>
                  {m.content}
                  <span className={styles.msgTime}>{formatMsgTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.inputRow}>
          <input
            className={styles.chatInput}
            placeholder={
              directRoomLoading ? "채팅방 로딩 중..." :
              directRoomError ? "연결 실패" :
              directConnected ? "메시지를 입력하세요..." : "연결 중..."
            }
            value={directInput}
            onChange={(e) => setDirectInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSendDirect(); }}
            disabled={!directConnected}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSendDirect}
            disabled={!directConnected || !directInput.trim()}
          >
            전송
          </button>
        </div>
      </div>
    )}

    {/* 단체채팅 팝업 — 화면 정중앙 */}
    {open === "group" && (
      <div className={styles.centeredPopup}>
        <div className={styles.popupHeader}>
          {groupView === "chat" && selectedGroupRoom ? (
            <>
              <button className={styles.backBtn} onClick={() => { setGroupView("list"); setSelectedGroupRoom(null); }}>←</button>
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedGroupRoom.name}</span>
                {groupConnected && <span className={styles.connectedBadge} style={{ flexShrink: 0 }}>연결됨</span>}
              </span>
            </>
          ) : (
            <span>단체채팅</span>
          )}
          <button className={styles.closeBtn} onClick={() => setOpen(null)}>✕</button>
        </div>

        {groupView === "list" ? (
          <>
            <div className={styles.groupListHeader}>
              <span style={{ fontSize: 13, color: "#64748b" }}>채팅방 목록</span>
              <button
                className={styles.createRoomBtn}
                onClick={() => setShowCreateForm((v) => !v)}
              >
                + 방 만들기
              </button>
            </div>
            {showCreateForm && (
              <div className={styles.createRoomForm}>
                <input
                  className={styles.chatInput}
                  placeholder="채팅방 이름..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateRoom(); }}
                />
                <button
                  className={styles.sendBtn}
                  onClick={handleCreateRoom}
                  disabled={creatingRoom || !newRoomName.trim()}
                >
                  생성
                </button>
              </div>
            )}
            <div className={styles.groupList}>
              {groupRoomLoading && <div className={styles.loadingHint}>불러오는 중...</div>}
              {!groupRoomLoading && groupRooms.length === 0 && (
                <div className={styles.loadingHint}>채팅방이 없습니다. 방을 만들어보세요!</div>
              )}
              {groupRooms.map((room) => (
                <div
                  key={room.id}
                  className={styles.groupRoomItem}
                  onClick={() => enterGroupRoom(room)}
                >
                  <span className={styles.groupRoomIcon}>💬</span>
                  <div className={styles.groupRoomInfo}>
                    <div className={styles.groupRoomName}>{room.name}</div>
                    <div className={styles.groupRoomDate}>{room.createdAt?.slice(0, 10)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={styles.messages} ref={groupScrollRef}>
              {groupMessages.length === 0 && (
                <div className={styles.loadingHint}>첫 번째 메시지를 보내보세요!</div>
              )}
              {groupMessages.map((m) => {
                const isMe = m.senderName === myName || (me?.id != null && m.senderId === me.id);
                return (
                  <div key={m.id} className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""}`}>
                    {!isMe && (
                      <div className={styles.senderRow}>
                        <span className={styles.senderName}>{m.senderName}</span>
                        <button
                          className={styles.reportBtn}
                          onClick={() => setReportingMsgId(m.id)}
                          title="신고"
                        >
                          ⚑
                        </button>
                      </div>
                    )}
                    <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : ""}`}>
                      {m.content}
                      <span className={styles.msgTime}>{formatMsgTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.inputRow}>
              <input
                className={styles.chatInput}
                placeholder={groupConnected ? "메시지를 입력하세요..." : "연결 중..."}
                value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendGroup(); }}
                disabled={!groupConnected}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSendGroup}
                disabled={!groupConnected || !groupInput.trim()}
              >
                전송
              </button>
            </div>
          </>
        )}
      </div>
    )}

    {/* 거래 채팅 팝업 — 화면 정중앙 */}
    {open === "trade" && (
      <div className={styles.centeredPopup}>
        <div className={styles.popupHeader}>
          {tradeView === "chat" && selectedTradeRoom ? (
            <>
              <button className={styles.backBtn} onClick={() => { setTradeView("list"); setSelectedTradeRoom(null); }}>←</button>
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTradeRoom.name}</span>
                {tradeConnected && <span className={styles.connectedBadge} style={{ flexShrink: 0 }}>연결됨</span>}
              </span>
            </>
          ) : (
            <span>거래 채팅</span>
          )}
          <button className={styles.closeBtn} onClick={() => setOpen(null)}>✕</button>
        </div>

        {tradeView === "list" ? (
          <>
            <div className={styles.groupListHeader}>
              <span style={{ fontSize: 13, color: "#64748b" }}>거래 채팅 목록</span>
            </div>
            <div className={styles.groupList}>
              {tradeRoomLoading && <div className={styles.loadingHint}>불러오는 중...</div>}
              {!tradeRoomLoading && tradeRooms.length === 0 && (
                <div className={styles.loadingHint}>체결된 거래가 없습니다.</div>
              )}
              {tradeRooms.map((room) => (
                <div
                  key={room.id}
                  className={styles.groupRoomItem}
                  onClick={() => { setSelectedTradeRoom(room); setTradeView("chat"); }}
                >
                  <span className={styles.groupRoomIcon}>🤝</span>
                  <div className={styles.groupRoomInfo}>
                    <div className={styles.groupRoomName}>{room.name}</div>
                    <div className={styles.groupRoomDate}>{room.createdAt?.slice(0, 10)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={styles.messages} ref={tradeScrollRef}>
              {tradeMessages.length === 0 && (
                <div className={styles.loadingHint}>거래에 대해 대화를 시작해보세요!</div>
              )}
              {tradeMessages.map((m) => {
                const isMe = m.senderName === myName || (me?.id != null && m.senderId === me.id);
                return (
                  <div key={m.id} className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""}`}>
                    {!isMe && (
                      <div className={styles.senderRow}>
                        <span className={styles.senderName}>{m.senderName}</span>
                        <button
                          className={styles.reportBtn}
                          onClick={() => setReportingMsgId(m.id)}
                          title="신고"
                        >
                          ⚑
                        </button>
                      </div>
                    )}
                    <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : ""}`}>
                      {m.content}
                      <span className={styles.msgTime}>{formatMsgTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.inputRow}>
              <input
                className={styles.chatInput}
                placeholder={tradeConnected ? "메시지를 입력하세요..." : "연결 중..."}
                value={tradeInput}
                onChange={(e) => setTradeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendTrade(); }}
                disabled={!tradeConnected}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSendTrade}
                disabled={!tradeConnected || !tradeInput.trim()}
              >
                전송
              </button>
            </div>
          </>
        )}
      </div>
    )}

    {open === "ai" && (
      <>
        <div className={styles.aiBackdrop} onClick={() => setOpen(null)} />
        <div className={styles.aiPopup}>
          {/* 헤더 */}
          <div className={styles.aiPopupHeader}>
            <div className={styles.aiProfileRow}>
              <div className={styles.aiProfileAvatar}>
                <img src="/favicon.svg" alt="무림 상담봇" />
              </div>
              <div className={styles.aiProfileInfo}>
                <span className={styles.aiProfileName}>무림 상담봇</span>
                <span className={styles.aiStatusRow}>
                  <span className={aiOnline ? styles.aiDotOn : styles.aiDotOff} />
                  {aiOnline
                    ? `온라인 · 평균 응답시간 ${aiAvgResponseMs !== null ? (aiAvgResponseMs / 1000).toFixed(1) + "초" : "측정 중"}`
                    : "오프라인 · 운영시간 9:00 ~ 18:00"}
                </span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(null)}>✕</button>
          </div>

          {/* 카테고리 빠른 버튼 바 */}
          <div className={styles.aiCategoryBar}>
            {AI_CATEGORY_BTNS.map((btn) => (
              <button
                key={btn.query}
                className={styles.aiCategoryBtn}
                onClick={() => sendAiCategoryBtn(btn.label, btn.query)}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* 메시지 영역 */}
          <div className={styles.messages} ref={aiScrollRef}>
            {aiMessages.map((m) => (
              <div key={m.id} className={styles.aiMsgBlock}>
                <div className={`${styles.msgRow} ${m.sender === "me" ? styles.msgRowMe : ""}`}>
                  {m.sender === "ai" && (
                    <div className={styles.aiAvatar}>
                      <img src="/favicon.svg" alt="봇" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
                    </div>
                  )}
                  <div
                    className={`${styles.bubble} ${m.sender === "me" ? styles.bubbleMe : m.format === "html" ? styles.bubbleAiHtml : styles.bubbleAi}`}
                    onClick={m.format === "html" ? (e) => {
                      const a = (e.target as HTMLElement).closest("a");
                      if (!a) return;
                      const href = a.getAttribute("href");
                      if (href && href.startsWith("/product/")) {
                        e.preventDefault();
                        setOpen(null);
                        navigate(href);
                      }
                    } : undefined}
                  >
                    {m.format === "html"
                      ? <div dangerouslySetInnerHTML={{ __html: m.text }} />
                      : m.text}
                    <span className={styles.msgTime}>{m.time}</span>
                  </div>
                </div>
                {m.sender === "ai" && m.buttons && m.buttons.length > 0 && (
                  <div className={styles.aiBtnGroupRow}>
                    {(m.buttonStyle === "product-choice" || m.buttonStyle === "clothing-choice") ? (
                      <div className={styles.productChoiceGrid}>
                        {m.buttons.map((btn) => (
                          <button key={btn.query} className={styles.productChoiceBtn} onClick={() => sendAiButton(btn.query)}>
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.aiBtnGroup}>
                        {m.buttons.map((btn) => (
                          <button key={btn.query} className={styles.aiBtn} onClick={() => sendAiButton(btn.query)}>
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {aiLoading && (
              <div className={styles.msgRow}>
                <div className={styles.aiAvatar}>
                  <img src="/favicon.svg" alt="봇" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
                </div>
                <div className={`${styles.bubble} ${styles.bubbleAi}`}>
                  <span className={styles.aiTyping}><span /><span /><span /></span>
                </div>
              </div>
            )}
          </div>

          {/* 입력 바 */}
          <div className={styles.aiInputRow}>
            <input
              className={styles.aiInput}
              placeholder="질문을 입력하세요..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendAi(); }}
              disabled={aiLoading}
            />
            <button className={styles.aiSendBtn} onClick={sendAi} disabled={aiLoading || !aiInput.trim()}>
              ▶
            </button>
          </div>
        </div>
      </>
    )}
    <div className={styles.container}>
      {/* 닉네임 설정 팝업 */}
      {showNicknameSetup && (
        <div className={styles.reportOverlay}>
          <div className={styles.reportBox}>
            <div className={styles.reportTitle}>닉네임 설정</div>
            <p style={{ fontSize: 13, color: "#111", fontWeight: 600, margin: "0 0 6px" }}>
              닉네임 설정을 진행합니다.
            </p>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px" }}>
              채팅에서 표시될 닉네임을 설정해주세요. (2~20자)
            </p>
            <input
              className={styles.chatInput}
              type="text"
              placeholder="닉네임을 입력하세요..."
              value={nicknameInput}
              maxLength={20}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveNickname(); }}
              style={{ marginBottom: 12 }}
            />
            <div className={styles.reportBtns}>
              <button
                className={styles.reportCancelBtn}
                onClick={() => { setShowNicknameSetup(false); setNicknameInput(""); setPendingChatType(null); }}
              >
                취소
              </button>
              <button
                className={styles.reportSubmitBtn}
                onClick={handleSaveNickname}
                disabled={savingNickname || nicknameInput.trim().length < 2}
              >
                {savingNickname ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {reportingMsgId !== null && (
        <div className={styles.reportOverlay}>
          <div className={styles.reportBox}>
            <div className={styles.reportTitle}>메시지 신고</div>
            <textarea
              className={styles.reportInput}
              placeholder="신고 사유를 입력하세요..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
            />
            <div className={styles.reportBtns}>
              <button className={styles.reportCancelBtn} onClick={() => { setReportingMsgId(null); setReportReason(""); }}>취소</button>
              <button className={styles.reportSubmitBtn} onClick={submitReport} disabled={!reportReason.trim()}>신고</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB 메뉴 */}
      <div className={styles.fab}>
        <div className={`${styles.subBtns} ${menuOpen ? styles.subBtnsOpen : ""}`}>
          <div className={styles.subItem}>
            <span className={styles.subLabel}>관리자 문의</span>
            <button className={styles.subBtn} onClick={() => openChat("direct")} title="관리자 문의">💬</button>
          </div>
          <div className={styles.subItem}>
            <span className={styles.subLabel}>거래 채팅</span>
            <button className={styles.subBtn} onClick={() => openChat("trade")} title="거래 채팅">🤝</button>
          </div>
          <div className={styles.subItem}>
            <span className={styles.subLabel}>단체채팅</span>
            <button className={styles.subBtn} onClick={() => openChat("group")} title="단체채팅">💬</button>
          </div>
          <div className={styles.subItem}>
            <span className={styles.subLabel}>AI 챗봇</span>
            <button className={styles.subBtn} onClick={() => openChat("ai")} title="AI 챗봇">🤖</button>
          </div>
        </div>
        <button
          className={`${styles.mainBtn} ${menuOpen ? styles.mainBtnOpen : ""}`}
          onClick={() => setMenuOpen((p) => !p)}
          title="채팅"
        >
          {menuOpen ? "✕" : "💬"}
        </button>
      </div>
    </div>
    </>
  );
}
