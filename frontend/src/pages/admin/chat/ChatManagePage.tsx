import { useState, useEffect, useRef, useCallback } from "react";
import styles from "@/pages/admin/admin.module.css";
import chatStyles from "./ChatManagePage.module.css";
import { useStompChat } from "@/shared/hooks/useStompChat";
import { useAuthStore } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";
import {
  apiGetAdminChatRooms,
  apiGetChatMessages,
  apiGetAdminReports,
  apiHandleReport,
  type AdminRoomListResponse,
  type ChatMessageResponse,
  type MessageReportResponse,
} from "@/shared/api/chatApi";

type AdminTab = "direct" | "group" | "reports";

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatManagePage() {
  const openAlert = useModalStore((s) => s.openAlert);
  const [tab, setTab] = useState<AdminTab>("direct");
  const [allRooms, setAllRooms] = useState<AdminRoomListResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [history, setHistory] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");

  const [reports, setReports] = useState<MessageReportResponse[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [handlingId, setHandlingId] = useState<number | null>(null);
  const [handleNote, setHandleNote] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminMe = useAuthStore((s) => s.me);

  // STOMP hook for selected room
  const { messages: liveMessages, sendMessage, connected } = useStompChat(selectedRoomId);

  // Combined messages: history + live (dedup by id)
  const liveIds = new Set(liveMessages.map((m) => m.id));
  const allMessages = [
    ...history.filter((m) => !liveIds.has(m.id)),
    ...liveMessages,
  ];

  // Load rooms
  const loadRooms = useCallback(() => {
    setLoading(true);
    apiGetAdminChatRooms()
      .then(setAllRooms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Load message history when room is selected
  useEffect(() => {
    if (!selectedRoomId) { setHistory([]); setHistoryLoaded(false); return; }
    setHistoryLoaded(false);
    apiGetChatMessages(selectedRoomId)
      .then((msgs) => { setHistory(msgs); setHistoryLoaded(true); })
      .catch(() => setHistoryLoaded(true));
  }, [selectedRoomId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  // Load reports
  useEffect(() => {
    if (tab !== "reports") return;
    setReportsLoading(true);
    apiGetAdminReports()
      .then(setReports)
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, [tab]);

  function handleSend() {
    if (!input.trim() || !selectedRoomId) return;
    sendMessage(input.trim());
    setInput("");
  }

  function handleSelectRoom(roomId: number) {
    if (selectedRoomId === roomId) return;
    setSelectedRoomId(roomId);
    setHistory([]);
    setInput("");
  }

  async function handleReport(reportId: number, action: "BAN" | "WITHDRAW" | "DISMISS") {
    try {
      const updated = await apiHandleReport(reportId, action, handleNote);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
      setHandlingId(null);
      setHandleNote("");
    } catch {
      openAlert("error", "오류", "처리 중 오류가 발생했습니다.");
    }
  }

  const directRooms = allRooms.filter((r) => r.type === "DIRECT");
  const groupRooms = allRooms.filter((r) => r.type === "GROUP");
  const shownRooms = tab === "direct" ? directRooms : groupRooms;
  const selectedRoom = allRooms.find((r) => r.id === selectedRoomId) ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>채팅 관리</h1>
          <p className={styles.pageDesc}>실시간 채팅 및 신고 내역을 관리합니다.</p>
        </div>
        <button className={styles.btnSecondary} onClick={loadRooms}>새로고침</button>
      </div>

      {/* 탭 */}
      <div className={styles.tabs} style={{ marginBottom: 16 }}>
        {(["direct", "group", "reports"] as AdminTab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => { setTab(t); setSelectedRoomId(null); }}
          >
            {t === "direct" ? `1:1 문의 (${directRooms.length})` : t === "group" ? `단체채팅 (${groupRooms.length})` : "신고 내역"}
          </button>
        ))}
      </div>

      {tab === "reports" ? (
        /* ─── 신고 내역 ─── */
        <div className={chatStyles.reportsPanel}>
          {reportsLoading ? (
            <p style={{ color: "#94a3b8", padding: 20 }}>불러오는 중...</p>
          ) : reports.length === 0 ? (
            <p style={{ color: "#94a3b8", padding: 20, textAlign: "center" }}>신고 내역이 없습니다.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className={chatStyles.reportCard}>
                <div className={chatStyles.reportCardTop}>
                  <span className={`${chatStyles.reportStatus} ${r.status === "PENDING" ? chatStyles.statusPending : chatStyles.statusHandled}`}>
                    {r.status === "PENDING" ? "대기중" : r.status === "HANDLED" ? "처리됨" : "기각"}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.createdAt?.slice(0, 10)}</span>
                </div>
                <div className={chatStyles.reportField}>
                  <span className={chatStyles.reportLabel}>신고자</span>
                  <span>{r.reporterEmail}</span>
                </div>
                <div className={chatStyles.reportField}>
                  <span className={chatStyles.reportLabel}>신고 대상</span>
                  <span>{r.senderName} ({r.senderId ?? "익명"})</span>
                </div>
                <div className={chatStyles.reportField}>
                  <span className={chatStyles.reportLabel}>메시지 내용</span>
                  <span className={chatStyles.reportMsg}>{r.messageContent}</span>
                </div>
                <div className={chatStyles.reportField}>
                  <span className={chatStyles.reportLabel}>신고 사유</span>
                  <span>{r.reason}</span>
                </div>
                {r.handledNote && (
                  <div className={chatStyles.reportField}>
                    <span className={chatStyles.reportLabel}>처리 메모</span>
                    <span>{r.handledNote}</span>
                  </div>
                )}
                {r.status === "PENDING" && (
                  handlingId === r.id ? (
                    <div className={chatStyles.handleForm}>
                      <input
                        className={chatStyles.handleInput}
                        placeholder="처리 메모 (선택)"
                        value={handleNote}
                        onChange={(e) => setHandleNote(e.target.value)}
                      />
                      <div className={chatStyles.handleBtns}>
                        <button className={chatStyles.btnDismiss} onClick={() => handleReport(r.id, "DISMISS")}>기각</button>
                        <button className={chatStyles.btnBan} onClick={() => handleReport(r.id, "BAN")}>차단</button>
                        <button className={chatStyles.btnWithdraw} onClick={() => handleReport(r.id, "WITHDRAW")}>탈퇴처리</button>
                        <button className={chatStyles.btnCancel} onClick={() => { setHandlingId(null); setHandleNote(""); }}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <button className={chatStyles.handleOpenBtn} onClick={() => setHandlingId(r.id)}>처리하기</button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* ─── 채팅 레이아웃 ─── */
        <div className={chatStyles.chatLayout}>
          {/* 채팅방 목록 */}
          <div className={chatStyles.roomList}>
            <div className={chatStyles.roomListHeader}>
              {tab === "direct" ? "1:1 문의" : "단체채팅"}{" "}
              <span className={styles.tabBadge}>{shownRooms.length}</span>
            </div>
            {loading && <p style={{ fontSize: 12, color: "#94a3b8", padding: "10px 16px" }}>불러오는 중...</p>}
            {!loading && shownRooms.length === 0 && (
              <p style={{ fontSize: 12, color: "#94a3b8", padding: "20px 16px", textAlign: "center" }}>채팅방이 없습니다.</p>
            )}
            {shownRooms.map((room) => (
              <div
                key={room.id}
                className={`${chatStyles.roomItem} ${selectedRoomId === room.id ? chatStyles.roomItemActive : ""}`}
                onClick={() => handleSelectRoom(room.id)}
              >
                <div className={chatStyles.roomInfo}>
                  <div className={chatStyles.roomTop}>
                    <span className={chatStyles.roomName}>{room.name}</span>
                    <span className={chatStyles.roomTime}>{formatTime(room.lastMessageAt)}</span>
                  </div>
                  <div className={chatStyles.roomLast}>{room.lastMessage ?? "대화 없음"}</div>
                  {connected && selectedRoomId === room.id && (
                    <div style={{ fontSize: 10, color: "#16a34a", marginTop: 2 }}>● 연결됨</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 채팅 창 */}
          <div className={chatStyles.chatBox}>
            {!selectedRoom ? (
              <div className={chatStyles.chatEmpty}>
                <p>💬</p>
                <p>채팅방을 선택해주세요.</p>
              </div>
            ) : (
              <>
                <div className={chatStyles.chatHeader}>
                  <strong>{selectedRoom.name}</strong>
                  {connected && <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 8 }}>● 연결됨</span>}
                </div>
                <div className={chatStyles.messages}>
                  {!historyLoaded && <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12 }}>불러오는 중...</p>}
                  {allMessages.map((msg) => {
                    const isAdmin = adminMe != null && (
                      msg.senderId === adminMe.id ||
                      msg.senderName === adminMe.name
                    );
                    return (
                      <div key={msg.id} className={`${chatStyles.msgWrap} ${isAdmin ? chatStyles.msgWrapAdmin : ""}`}>
                        {!isAdmin && (
                          <div className={chatStyles.msgSenderInfo}>
                            <span className={chatStyles.msgSenderName}>{msg.senderName}</span>
                          </div>
                        )}
                        <div className={`${chatStyles.bubble} ${isAdmin ? chatStyles.bubbleAdmin : ""}`}>
                          {msg.content}
                          <div className={chatStyles.msgTime}>{formatTime(msg.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className={chatStyles.inputArea}>
                  <input
                    className={chatStyles.chatInput}
                    placeholder={connected ? "답변을 입력하세요..." : "연결 중..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={!connected}
                  />
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleSend}
                    disabled={!input.trim() || !connected}
                  >
                    전송
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
