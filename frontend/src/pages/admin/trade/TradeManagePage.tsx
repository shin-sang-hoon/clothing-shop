import { useCallback, useEffect, useState } from "react";
import AdminPagination from "@/components/admin/common/AdminPagination";
import {
    apiGetAdminConcludedTrades,
    apiGetAdminBuyBids,
    apiGetAdminSellBids,
    type AdminConcludedTradeRow,
    type AdminBuyBidRow,
    type AdminSellBidRow,
} from "@/shared/api/tradeApi";
import type { PageResult } from "@/shared/api/tradeApi";
import styles from "../admin.module.css";

type TradeTab = "concluded" | "buyBids" | "sellBids";

const STATUS_BADGE: Record<string, string> = {
    PENDING:   "badgeBlue",
    MATCHED:   "badgeGreen",
    CANCELLED: "badgeGray",
};

const STATUS_LABEL: Record<string, string> = {
    PENDING:   "대기",
    MATCHED:   "체결",
    CANCELLED: "취소",
};

export default function TradeManagePage() {
    const [tab, setTab] = useState<TradeTab>("concluded");
    const [keyword, setKeyword] = useState("");

    const [concludedData, setConcludedData] = useState<PageResult<AdminConcludedTradeRow> | null>(null);
    const [buyBidData,    setBuyBidData]    = useState<PageResult<AdminBuyBidRow> | null>(null);
    const [sellBidData,   setSellBidData]   = useState<PageResult<AdminSellBidRow> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);

    const loadData = useCallback(async (currentTab: TradeTab, pg: number, sz: number, kw?: string) => {
        setIsLoading(true);
        try {
            if (currentTab === "concluded") {
                setConcludedData(await apiGetAdminConcludedTrades(pg, sz, kw));
            } else if (currentTab === "buyBids") {
                setBuyBidData(await apiGetAdminBuyBids(pg, sz));
            } else {
                setSellBidData(await apiGetAdminSellBids(pg, sz));
            }
        } catch {
            /* 조회 실패 시 무시 */
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(0);
        void loadData(tab, 0, size);
    }, [tab]);

    function handleSearch() {
        setPage(0);
        void loadData(tab, 0, size, keyword || undefined);
    }

    function handleChangePage(pg: number) {
        setPage(pg);
        void loadData(tab, pg, size, keyword || undefined);
    }

    function handleChangeSize(sz: number) {
        setSize(sz);
        setPage(0);
        void loadData(tab, 0, sz, keyword || undefined);
    }

    const currentPageData =
        tab === "concluded" ? concludedData :
        tab === "buyBids"   ? buyBidData    : sellBidData;

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>거래 관리</h1>
                    <p className={styles.pageDesc}>체결 거래 및 입찰 현황을 조회합니다.</p>
                </div>
            </div>

            {/* 검색 (체결 거래 탭에서만 키워드 검색) */}
            {tab === "concluded" && (
                <div className={styles.searchBar}>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="주문번호, 상품명, 이메일 검색"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    />
                    <button type="button" className={styles.btnPrimary} onClick={handleSearch}>
                        조회
                    </button>
                </div>
            )}

            {/* 탭 */}
            <div className={styles.tabs}>
                {([
                    { key: "concluded", label: "체결 거래" },
                    { key: "buyBids",   label: "구매 입찰" },
                    { key: "sellBids",  label: "판매 입찰" },
                ] as { key: TradeTab; label: string }[]).map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 테이블 */}
            <div className={styles.tableWrap}>
                <div className={styles.tableHeader}>
                    <span className={styles.tableCount}>
                        총 <strong>{currentPageData?.totalElements ?? 0}</strong>건
                    </span>
                </div>

                <table className={styles.table}>
                    {tab === "concluded" && (
                        <>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>주문번호</th>
                                    <th>상품명</th>
                                    <th>옵션</th>
                                    <th>체결가</th>
                                    <th>구매자</th>
                                    <th>판매자</th>
                                    <th>거래일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={8} className={styles.empty}>조회 중...</td></tr>
                                ) : !concludedData || concludedData.content.length === 0 ? (
                                    <tr><td colSpan={8} className={styles.empty}>체결 거래가 없습니다.</td></tr>
                                ) : (
                                    concludedData.content.map((t, i) => (
                                        <tr key={t.id}>
                                            <td style={{ color: "#94a3b8" }}>{page * size + i + 1}</td>
                                            <td style={{ fontSize: 12, color: "#6b7280" }}>{t.tradeNo ?? "-"}</td>
                                            <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.itemName}</td>
                                            <td>{t.optionValue ?? "-"}</td>
                                            <td style={{ fontWeight: 700 }}>{t.tradePrice.toLocaleString()}원</td>
                                            <td style={{ color: "#6b7280", fontSize: 12 }}>{t.buyerEmail}</td>
                                            <td style={{ color: "#6b7280", fontSize: 12 }}>{t.sellerEmail}</td>
                                            <td style={{ color: "#94a3b8", fontSize: 12 }}>{t.createdAt?.slice(0, 10)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </>
                    )}

                    {tab === "buyBids" && (
                        <>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>상품명</th>
                                    <th>옵션</th>
                                    <th>입찰가</th>
                                    <th>상태</th>
                                    <th>구매자</th>
                                    <th>등록일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={7} className={styles.empty}>조회 중...</td></tr>
                                ) : !buyBidData || buyBidData.content.length === 0 ? (
                                    <tr><td colSpan={7} className={styles.empty}>구매 입찰이 없습니다.</td></tr>
                                ) : (
                                    buyBidData.content.map((b, i) => (
                                        <tr key={b.id}>
                                            <td style={{ color: "#94a3b8" }}>{page * size + i + 1}</td>
                                            <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.itemName}</td>
                                            <td>{b.optionValue ?? "-"}</td>
                                            <td style={{ fontWeight: 700 }}>{b.price.toLocaleString()}원</td>
                                            <td>
                                                <span className={`${styles.badge} ${styles[STATUS_BADGE[b.status] ?? "badgeGray"]}`}>
                                                    {STATUS_LABEL[b.status] ?? b.status}
                                                </span>
                                            </td>
                                            <td style={{ color: "#6b7280", fontSize: 12 }}>{b.buyerEmail ?? "-"}</td>
                                            <td style={{ color: "#94a3b8", fontSize: 12 }}>{b.createdAt?.slice(0, 10)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </>
                    )}

                    {tab === "sellBids" && (
                        <>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>상품명</th>
                                    <th>옵션</th>
                                    <th>입찰가</th>
                                    <th>상태</th>
                                    <th>판매자</th>
                                    <th>등록일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={7} className={styles.empty}>조회 중...</td></tr>
                                ) : !sellBidData || sellBidData.content.length === 0 ? (
                                    <tr><td colSpan={7} className={styles.empty}>판매 입찰이 없습니다.</td></tr>
                                ) : (
                                    sellBidData.content.map((s, i) => (
                                        <tr key={s.id}>
                                            <td style={{ color: "#94a3b8" }}>{page * size + i + 1}</td>
                                            <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.itemName}</td>
                                            <td>{s.optionValue ?? "-"}</td>
                                            <td style={{ fontWeight: 700 }}>{s.price.toLocaleString()}원</td>
                                            <td>
                                                <span className={`${styles.badge} ${styles[STATUS_BADGE[s.status] ?? "badgeGray"]}`}>
                                                    {STATUS_LABEL[s.status] ?? s.status}
                                                </span>
                                            </td>
                                            <td style={{ color: "#6b7280", fontSize: 12 }}>{s.sellerEmail ?? "-"}</td>
                                            <td style={{ color: "#94a3b8", fontSize: 12 }}>{s.createdAt?.slice(0, 10)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </>
                    )}
                </table>
            </div>

            <AdminPagination
                totalElements={currentPageData?.totalElements ?? 0}
                page={page}
                size={size}
                totalPages={currentPageData?.totalPages ?? 0}
                first={currentPageData?.first}
                last={currentPageData?.last}
                onChangePage={handleChangePage}
                onChangePageSize={handleChangeSize}
            />
        </div>
    );
}
