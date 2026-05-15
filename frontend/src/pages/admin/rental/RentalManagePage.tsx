import { useEffect, useMemo, useState } from "react";
import AdminPagination from "@/components/admin/common/AdminPagination";
import { apiGetAdminRentals, apiAdminUpdateRentalStatus, apiAdminUpdateDeliveryStatus, apiAdminRegisterShipping, type AdminRentalListRow } from "@/shared/api/rentalApi";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "../admin.module.css";
import pageStyles from "./RentalManagePage.module.css";

const TABS = ["전체", "대기중", "렌탈중", "반납완료", "취소"] as const;
type RentalStatus = typeof TABS[number];

const SEARCH_TYPES = [
  { label: "상품명", value: "item" },
  { label: "브랜드", value: "brand" },
  { label: "렌탈자", value: "renter" },
  { label: "받는분", value: "receiver" },
];

const badgeClass = (s: string, st: Record<string, string>) =>
  ({ 렌탈중: st.badgeBlue, 반납완료: st.badgeGreen, 대기중: st.badgeGray, 취소: st.badgeRed }[s] ?? st.badgeGray);

function getQuickDateRange(type: "today" | "1w" | "1m" | "3m") {
  const to = new Date();
  const from = new Date();
  if (type === "1w") from.setDate(from.getDate() - 7);
  else if (type === "1m") from.setMonth(from.getMonth() - 1);
  else if (type === "3m") from.setMonth(from.getMonth() - 3);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

interface AppliedFilter {
  searchType: string;
  keyword: string;
  dateFrom: string;
  dateTo: string;
}

export default function RentalManagePage() {
  /* ── 데이터 ── */
  const [allItems, setAllItems] = useState<AdminRentalListRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetAdminRentals(0, 1000)
      .then((res) => setAllItems(res.content))
      .catch(() => setAllItems([]))
      .finally(() => setLoading(false));
  }, []);

  /* ── 검색 입력 상태 ── */
  const [searchType, setSearchType] = useState("item");
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* ── 적용된 검색 조건 ── */
  const [applied, setApplied] = useState<AppliedFilter>({
    searchType: "item",
    keyword: "",
    dateFrom: "",
    dateTo: "",
  });

  const openAlert = useModalStore((s) => s.openAlert);

  /* ── 상태 탭 ── */
  const [tab, setTab] = useState<RentalStatus>("전체");

  /* ── 페이지 상태 ── */
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  /* ── 상태 변경 ── */
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  async function handleStatusChange(rentalId: number, newStatus: string) {
    setUpdatingIds((prev) => new Set(prev).add(rentalId));
    try {
      await apiAdminUpdateRentalStatus(rentalId, newStatus);
      setAllItems((prev) =>
        prev.map((r) => (r.rentalId === rentalId ? { ...r, status: newStatus } : r))
      );
    } catch {
      openAlert("error", "상태 변경 실패", "상태 변경에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => { const s = new Set(prev); s.delete(rentalId); return s; });
    }
  }

  async function handleDeliveryStatusChange(rentalId: number, deliveryStatus: string) {
    setUpdatingIds((prev) => new Set(prev).add(rentalId));
    try {
      await apiAdminUpdateDeliveryStatus(rentalId, deliveryStatus);
      setAllItems((prev) =>
        prev.map((r) => {
          if (r.rentalId !== rentalId) return r;
          // 상품 도착 시 렌탈 상태 자동으로 렌탈중으로 UI 업데이트
          const status = deliveryStatus === "DELIVERED" ? "렌탈중" : r.status;
          return { ...r, deliveryStatus, status };
        })
      );
    } catch {
      openAlert("error", "배송 상태 변경 실패", "배송 상태 변경에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => { const s = new Set(prev); s.delete(rentalId); return s; });
    }
  }

  /* ── 상세 모달 ── */
  const [detail, setDetail] = useState<AdminRentalListRow | null>(null);

  /* ── 배송(운송장) 등록 ── */
  interface ShipInfo { courier: string; trackingNo: string; }
  const [shipMap, setShipMap] = useState<Record<number, ShipInfo>>({});
  const [shipForm, setShipForm] = useState<ShipInfo>({ courier: "", trackingNo: "" });
  const [showShipForm, setShowShipForm] = useState(false);

  function openShipForm(rentalId: number) {
    setShipForm(shipMap[rentalId] ?? { courier: "", trackingNo: "" });
    setShowShipForm(true);
  }

  async function saveShipInfo() {
    if (!detail) return;
    if (!shipForm.courier.trim() || !shipForm.trackingNo.trim()) return;
    setUpdatingIds((prev) => new Set(prev).add(detail.rentalId));
    try {
      await apiAdminRegisterShipping(detail.rentalId, shipForm.courier, shipForm.trackingNo);
      setShipMap((prev) => ({ ...prev, [detail.rentalId]: { ...shipForm } }));
      // 운송장 등록 시 배송 상태 자동으로 SHIPPING, 렌탈 상태는 변경 없음
      setAllItems((prev) =>
        prev.map((r) =>
          r.rentalId === detail.rentalId ? { ...r, deliveryStatus: "SHIPPING" } : r
        )
      );
      setShowShipForm(false);
    } catch {
      openAlert("error", "운송장 등록 실패", "운송장 등록에 실패했습니다.");
    } finally {
      setUpdatingIds((prev) => { const s = new Set(prev); s.delete(detail.rentalId); return s; });
    }
  }

  function handleQuickDate(type: "today" | "1w" | "1m" | "3m") {
    const { from, to } = getQuickDateRange(type);
    setDateFrom(from);
    setDateTo(to);
  }

  function handleSearch() {
    setApplied({ searchType, keyword, dateFrom, dateTo });
    setPage(0);
  }

  function handleReset() {
    const reset: AppliedFilter = { searchType: "item", keyword: "", dateFrom: "", dateTo: "" };
    setSearchType("item");
    setKeyword("");
    setDateFrom("");
    setDateTo("");
    setApplied(reset);
    setPage(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleTabChange(value: RentalStatus) {
    setTab(value);
    setPage(0);
  }

  /* ── 필터링 (탭 제외) ── */
  const filteredWithoutTab = useMemo(() =>
    allItems.filter((r) => {
      const kw = applied.keyword.trim();
      const matchKw = !kw || (
        applied.searchType === "item"     ? r.itemName.includes(kw) :
        applied.searchType === "brand"    ? r.brandName.includes(kw) :
        applied.searchType === "renter"   ? (r.renterName + r.renterEmail + r.renterPhone).includes(kw) :
        (r.receiverName + r.receiverPhone).includes(kw)
      );
      const dateStr = r.createdAt.slice(0, 10);
      const matchDate =
        (!applied.dateFrom || dateStr >= applied.dateFrom) &&
        (!applied.dateTo   || dateStr <= applied.dateTo);
      return matchKw && matchDate;
    }),
    [allItems, applied],
  );

  const filtered = useMemo(() =>
    filteredWithoutTab.filter((r) => tab === "전체" || r.status === tab),
    [filteredWithoutTab, tab],
  );

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const pagedItems = filtered.slice(page * size, (page + 1) * size);

  return (
    <div className={styles.page}>
      {/* ── 상세 모달 ── */}
      {detail && (
        <div className={styles.modal} onClick={() => setDetail(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle}>렌탈 상세 — {detail.itemName}</p>
              <button type="button" className={styles.btnIcon} onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "주문번호",   value: detail.orderNo },
                  { label: "상품명",    value: detail.itemName },
                  { label: "브랜드",    value: detail.brandName },
                  { label: "렌탈자",    value: `${detail.renterName} (${detail.renterEmail})` },
                  { label: "렌탈자 전화", value: detail.renterPhone },
                  { label: "판매자",    value: `${detail.sellerName} (${detail.sellerEmail})` },
                  { label: "판매자 전화", value: detail.sellerPhone },
                  { label: "받는분",    value: detail.receiverName },
                  { label: "받는분 전화", value: detail.receiverPhone },
                  { label: "입금액",    value: detail.paidAmount != null ? `${detail.paidAmount.toLocaleString()}원` : "-" },
                  { label: "상태",     value: allItems.find((r) => r.rentalId === detail.rentalId)?.status ?? detail.status },
                  { label: "등록일",   value: detail.createdAt.slice(0, 10) },
                ].map((i) => (
                  <div key={i.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{i.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{i.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* 배송 등록 영역 */}
            <div style={{ padding: "0 20px 16px" }}>
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>택배 배송 정보</span>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    style={{ fontSize: 12, padding: "4px 12px" }}
                    onClick={() => openShipForm(detail.rentalId)}
                  >
                    {shipMap[detail.rentalId] ? "수정" : "운송장 등록"}
                  </button>
                </div>
                {shipMap[detail.rentalId] ? (
                  <div style={{ display: "flex", gap: 24, background: "#f0fdf4", borderRadius: 8, padding: "10px 14px" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>택배사</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{shipMap[detail.rentalId].courier}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>운송장 번호</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{shipMap[detail.rentalId].trackingNo}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>등록된 운송장 정보가 없습니다.</div>
                )}
              </div>
              {showShipForm && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <select
                    style={{ height: 36, padding: "0 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
                    value={shipForm.courier}
                    onChange={(e) => setShipForm((p) => ({ ...p, courier: e.target.value }))}
                  >
                    <option value="">택배사 선택</option>
                    {["CJ대한통운", "한진택배", "롯데택배", "우체국택배", "로젠택배", "경동택배"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    style={{ flex: 1, minWidth: 140, height: 36, padding: "0 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
                    placeholder="운송장 번호"
                    value={shipForm.trackingNo}
                    onChange={(e) => setShipForm((p) => ({ ...p, trackingNo: e.target.value }))}
                  />
                  <button type="button" className={styles.btnPrimary} style={{ fontSize: 12, padding: "0 14px" }} onClick={saveShipInfo}>저장</button>
                  <button type="button" className={styles.btnSecondary} style={{ fontSize: 12, padding: "0 14px" }} onClick={() => setShowShipForm(false)}>취소</button>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={() => { setDetail(null); setShowShipForm(false); }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>렌탈 조회/관리</h1>
          <p className={styles.pageDesc}>렌탈 진행 현황을 조회하고 상태를 관리합니다.</p>
        </div>
      </div>

      {/* ── 검색 영역 ── */}
      <div className={pageStyles.searchPanel}>
        <div className={pageStyles.searchRow}>
          <span className={pageStyles.searchLabel}>기간</span>
          <div className={pageStyles.dateGroup}>
            <button type="button" className={pageStyles.quickBtn} onClick={() => handleQuickDate("today")}>오늘</button>
            <button type="button" className={pageStyles.quickBtn} onClick={() => handleQuickDate("1w")}>1주일</button>
            <button type="button" className={pageStyles.quickBtn} onClick={() => handleQuickDate("1m")}>1개월</button>
            <button type="button" className={pageStyles.quickBtn} onClick={() => handleQuickDate("3m")}>3개월</button>
            <input type="date" className={pageStyles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className={pageStyles.dateSep}>~</span>
            <input type="date" className={pageStyles.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className={pageStyles.searchRow}>
          <span className={pageStyles.searchLabel}>검색어</span>
          <div className={pageStyles.keywordGroup}>
            <select className={styles.filterSelect} value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              {SEARCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              className={pageStyles.keywordInput}
              placeholder="검색어를 입력하세요"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className={pageStyles.searchActions}>
            <button type="button" className={styles.btnPrimary} onClick={handleSearch}>검색</button>
            <button type="button" className={styles.btnSecondary} onClick={handleReset}>초기화</button>
          </div>
        </div>
      </div>

      {/* ── 상태 탭 ── */}
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => handleTabChange(t)}
          >
            {t}
            <span className={styles.tabBadge}>
              {t === "전체" ? filteredWithoutTab.length : filteredWithoutTab.filter((r) => r.status === t).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── 테이블 ── */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.tableCount}>총 <strong>{totalElements}</strong>건</span>
        </div>
        {loading ? (
          <p style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>불러오는 중...</p>
        ) : (
          <div className={pageStyles.tableScroll}>
        <table className={styles.table}>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>상품명</th>
                <th>브랜드</th>
                <th>렌탈자</th>
                <th>렌탈자 전화</th>
                <th>판매자</th>
                <th>판매자 전화</th>
                <th>받는분</th>
                <th>받는분 전화</th>
                <th>입금액</th>
                <th>렌탈 상태</th>
                <th>배송 상태</th>
                <th>등록일</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.length === 0 && (
                <tr><td colSpan={14} className={styles.empty}>데이터가 없습니다.</td></tr>
              )}
              {pagedItems.map((r) => (
                <tr key={r.rentalId}>
                  <td style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>{r.orderNo}</td>
                  <td style={{ fontWeight: 600 }}>{r.itemName}</td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>{r.brandName}</td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.renterName}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{r.renterEmail}</div>
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>{r.renterPhone}</td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.sellerName}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{r.sellerEmail}</div>
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>{r.sellerPhone}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{r.receiverName}</td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>{r.receiverPhone}</td>
                  <td style={{ fontWeight: 700, color: "#2563eb" }}>
                    {r.paidAmount != null ? `${r.paidAmount.toLocaleString()}원` : "-"}
                  </td>
                  <td>
                    <select
                      className={pageStyles.statusSelect}
                      value={r.status}
                      disabled={updatingIds.has(r.rentalId)}
                      onChange={(e) => handleStatusChange(r.rentalId, e.target.value)}
                    >
                      {["대기중", "렌탈중", "반납완료", "취소"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={pageStyles.statusSelect}
                      value={r.deliveryStatus ?? "NONE"}
                      disabled={updatingIds.has(r.rentalId)}
                      onChange={(e) => handleDeliveryStatusChange(r.rentalId, e.target.value)}
                    >
                      <option value="NONE">준비 전</option>
                      <option value="READY">상품 준비</option>
                      <option value="SHIPPING">상품 이동중</option>
                      <option value="DELIVERED">상품 도착</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>{r.createdAt.slice(0, 10)}</td>
                  <td>
                    <button type="button" className={styles.btnIcon} onClick={() => setDetail(r)}>상세</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── 페이지네이션 ── */}
      <AdminPagination
        totalElements={totalElements}
        page={page}
        size={size}
        totalPages={totalPages}
        first={page === 0}
        last={page >= totalPages - 1}
        onChangePage={(p) => { if (p >= 0 && p < totalPages) setPage(p); }}
        onChangePageSize={(s) => { setSize(s); setPage(0); }}
        sizeOptions={[10, 20, 50]}
      />
    </div>
  );
}
