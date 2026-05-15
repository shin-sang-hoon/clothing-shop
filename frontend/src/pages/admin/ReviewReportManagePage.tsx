import { useEffect, useState } from "react";
import { apiGetAdminReviewReports, apiHandleReviewReport, type ReviewReportResponse } from "@/shared/api/reviewApi";
import styles from "./admin.module.css";

type StatusFilter = "ALL" | "PENDING" | "RESOLVED" | "DISMISSED";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "PENDING", label: "처리 대기" },
  { key: "RESOLVED", label: "승인(삭제)" },
  { key: "DISMISSED", label: "기각" },
];

function statusBadge(status: string) {
  if (status === "PENDING") return { bg: "#fef3c7", color: "#92400e", text: "처리 대기" };
  if (status === "RESOLVED") return { bg: "#d1fae5", color: "#065f46", text: "승인(삭제)" };
  if (status === "DISMISSED") return { bg: "#e2e8f0", color: "#475569", text: "기각" };
  return { bg: "#e2e8f0", color: "#475569", text: status };
}

export default function ReviewReportManagePage() {
  const [reports, setReports] = useState<ReviewReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusFilter>("ALL");
  const [handling, setHandling] = useState<number | null>(null);
  const [noteMap, setNoteMap] = useState<Record<number, string>>({});

  useEffect(() => {
    apiGetAdminReviewReports()
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "ALL" ? reports : reports.filter((r) => r.status === tab);

  async function handle(reportId: number, action: "RESOLVE" | "DISMISS") {
    if (handling !== null) return;
    setHandling(reportId);
    try {
      const updated = await apiHandleReviewReport(reportId, action, noteMap[reportId]);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setHandling(null);
    }
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>리뷰 신고 관리</h1>
        <span style={{ fontSize: 13, color: "#64748b" }}>총 {reports.length}건</span>
      </div>

      {/* 상태 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid",
              borderColor: tab === t.key ? "#6366f1" : "#e2e8f0",
              background: tab === t.key ? "#6366f1" : "#fff",
              color: tab === t.key ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.label}
            <span style={{ marginLeft: 4, opacity: 0.75 }}>
              ({t.key === "ALL" ? reports.length : reports.filter((r) => r.status === t.key).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>신고된 리뷰가 없습니다.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>리뷰 작성자</th>
                <th>리뷰 내용</th>
                <th>신고자</th>
                <th>신고 사유</th>
                <th>상태</th>
                <th>처리 메모</th>
                <th>신고일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const badge = statusBadge(r.status);
                const isPending = r.status === "PENDING";
                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.reviewAuthor}</td>
                    <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.reviewContent}
                    </td>
                    <td>{r.reporterName}</td>
                    <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.reason}
                    </td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                        background: badge.bg, color: badge.color,
                      }}>
                        {badge.text}
                      </span>
                    </td>
                    <td>
                      {isPending ? (
                        <input
                          type="text"
                          placeholder="메모 (선택)"
                          value={noteMap[r.id] ?? ""}
                          onChange={(e) => setNoteMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          style={{ fontSize: 12, padding: "3px 6px", border: "1px solid #e2e8f0", borderRadius: 4, width: 120 }}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: "#64748b" }}>{r.handledNote ?? "-"}</span>
                      )}
                    </td>
                    <td>{r.createdAt}</td>
                    <td>
                      {isPending ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handle(r.id, "RESOLVE")}
                            disabled={handling === r.id}
                            style={{
                              padding: "4px 10px", fontSize: 12, fontWeight: 600,
                              background: "#ef4444", color: "#fff",
                              border: "none", borderRadius: 4, cursor: "pointer",
                            }}
                          >
                            승인(삭제)
                          </button>
                          <button
                            onClick={() => handle(r.id, "DISMISS")}
                            disabled={handling === r.id}
                            style={{
                              padding: "4px 10px", fontSize: 12, fontWeight: 600,
                              background: "#94a3b8", color: "#fff",
                              border: "none", borderRadius: 4, cursor: "pointer",
                            }}
                          >
                            기각
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>처리 완료</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
