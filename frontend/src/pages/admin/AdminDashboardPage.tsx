import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetAdminRentals, type AdminRentalListRow } from "@/shared/api/rentalApi";
import { apiGetAdminConcludedTrades, type AdminConcludedTradeRow } from "@/shared/api/tradeApi";
import { apiListAdminMembers } from "@/shared/api/admin/memberApi";
import { apiGetAdminAuditLogs, type AdminAuditLogRow } from "@/shared/api/admin/logApi";
import { apiGetAdminChatRooms, type AdminRoomListResponse } from "@/shared/api/chatApi";
import { apiGetAdminReviewReports, type ReviewReportResponse } from "@/shared/api/reviewApi";
import styles from "./admin.module.css";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [totalMembers, setTotalMembers] = useState(0);
  const [recentRentals, setRecentRentals] = useState<AdminRentalListRow[]>([]);
  const [totalRental, setTotalRental] = useState(0);
  const [recentTrades, setRecentTrades] = useState<AdminConcludedTradeRow[]>([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [chatRooms, setChatRooms] = useState<AdminRoomListResponse[]>([]);
  const [reviewReports, setReviewReports] = useState<ReviewReportResponse[]>([]);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLogRow[]>([]);

  useEffect(() => {
    apiListAdminMembers({ page: 0, size: 1 })
      .then((res) => setTotalMembers(res.totalElements))
      .catch(() => {});

    apiGetAdminRentals(0, 5)
      .then((res) => {
        setRecentRentals(res.content);
        setTotalRental(res.totalElements);
      })
      .catch(() => {});

    apiGetAdminConcludedTrades(0, 5)
      .then((res) => {
        setRecentTrades(res.content);
        setTotalTrades(res.totalElements);
      })
      .catch(() => {});

    apiGetAdminChatRooms()
      .then((rooms) => setChatRooms(rooms))
      .catch(() => {});

    apiGetAdminReviewReports()
      .then((list) => setReviewReports(list.filter((r) => r.status === "PENDING")))
      .catch(() => {});

    apiGetAdminAuditLogs({ page: 0, size: 5 })
      .then((res) => setRecentLogs(res.content))
      .catch(() => {});
  }, []);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      렌탈중: styles.badgeBlue, 반납완료: styles.badgeGreen, 대기중: styles.badgeGray,
      취소: styles.badgeRed, 입찰중: styles.badgeOrange, 낙찰완료: styles.badgeGreen, 유찰: styles.badgeGray,
    };
    return map[s] ?? styles.badgeGray;
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>대시보드</h1>
          <p className={styles.pageDesc}>MUREAM 관리자 현황을 한눈에 확인합니다.</p>
        </div>
      </div>

      {/* 스탯 카드 */}
      <div className={styles.statGrid}>
        {[
          { icon: "👥", label: "총 회원수",   value: totalMembers, sub: "전체 가입 회원",  cls: styles.statIconBlue   },
          { icon: "🏷️", label: "렌탈 전체",   value: totalRental,  sub: "전체 렌탈 건수", cls: styles.statIconGreen  },
          { icon: "🤝", label: "체결 거래",   value: totalTrades, sub: "전체 체결 건수", cls: styles.statIconOrange },
          { icon: "💬", label: "채팅방",      value: chatRooms.length, sub: "전체 채팅방", cls: styles.statIconPurple },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.cls}`}>{s.icon}</div>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statSub}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 3열 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

        {/* 렌탈 현황 */}
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p className={styles.sectionTitle} style={{ margin: 0 }}>렌탈 진행 내역</p>
            <button type="button" className={styles.btnSecondary} style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => navigate("/admin/rental")}>전체보기</button>
          </div>
          {recentRentals.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>렌탈 내역 없음</p>}
          {recentRentals.map((r) => (
            <div key={r.rentalId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div className={styles.itemThumb}>🏷️</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.itemTitle} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.itemName}</div>
                <div className={styles.itemBrand}>{r.renterName}</div>
              </div>
              <span className={`${styles.badge} ${statusBadge(r.status)}`}>{r.status}</span>
            </div>
          ))}
        </div>

        {/* 체결 거래 현황 */}
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p className={styles.sectionTitle} style={{ margin: 0 }}>체결 거래 현황</p>
            <button type="button" className={styles.btnSecondary} style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => navigate("/admin/trade")}>전체보기</button>
          </div>
          {recentTrades.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>체결 거래 없음</p>}
          {recentTrades.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div className={styles.itemThumb}>🤝</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.itemTitle} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.itemName}</div>
                <div className={styles.itemBrand}>{t.tradePrice.toLocaleString()}원 · {t.buyerEmail}</div>
              </div>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>체결</span>
            </div>
          ))}
        </div>

        {/* 리뷰 신고 */}
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p className={styles.sectionTitle} style={{ margin: 0 }}>리뷰 신고 ({reviewReports.length}건 대기)</p>
            <button type="button" className={styles.btnSecondary} style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => navigate("/admin/review-reports")}>전체보기</button>
          </div>
          {reviewReports.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>처리 대기 신고 없음</p>}
          {reviewReports.slice(0, 4).map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 10, padding: "8px", borderRadius: 8, background: "#fef2f2", cursor: "pointer", marginBottom: 6 }} onClick={() => navigate("/admin/review-reports")}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🚨</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.reviewAuthor} 작성 리뷰</div>
                <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>사유: {r.reason}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 미답변 채팅 */}
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p className={styles.sectionTitle} style={{ margin: 0 }}>미답변 채팅</p>
            <button type="button" className={styles.btnSecondary} style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => navigate("/admin/chat")}>전체보기</button>
          </div>
          {chatRooms.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>채팅방 없음</p>}
          {chatRooms.slice(0, 5).map((room) => (
            <div key={room.id} style={{ display: "flex", gap: 10, padding: "8px", borderRadius: 8, background: "#f8fafc", cursor: "pointer", marginBottom: 6 }} onClick={() => navigate("/admin/chat")}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>💬</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{room.name}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{room.lastMessageAt ? room.lastMessageAt.split("T")[1]?.slice(0, 5) : ""}</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.lastMessage ?? "메시지 없음"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 로그 */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <p className={styles.sectionTitle} style={{ margin: 0 }}>최근 활동 로그</p>
          <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/log")}>전체보기</button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>유형</th><th>액션</th><th>대상</th><th>처리자</th><th>일시</th></tr>
          </thead>
          <tbody>
            {recentLogs.map((log) => (
              <tr key={log.id}>
                <td><span className={`${styles.badge} ${log.category === "MEMBER" ? styles.badgeBlue : log.category === "SHOP" ? styles.badgeOrange : styles.badgeGray}`}>{log.category}</span></td>
                <td style={{ fontWeight: 600 }}>{log.eventType}</td>
                <td style={{ fontSize: 12, color: "#6b7280", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.message ?? "-"}</td>
                <td style={{ color: "#6b7280" }}>{log.actorEmail ?? "-"}</td>
                <td style={{ color: "#94a3b8", fontSize: 12 }}>{log.createdAt.replace("T", " ").slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
