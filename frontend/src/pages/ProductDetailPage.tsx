import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import FavoriteButton from "@/components/common/FavoriteButton";
import ReviewModal, { type ReviewFormData } from "@/components/user/product/ReviewModal";
import BuyBidModal from "@/components/user/product/BuyBidModal";
import SellBidModal from "@/components/user/product/SellBidModal";
import RentalModal from "@/components/user/product/RentalModal";
import { apiGetGroupRoom, apiReportMessage } from "@/shared/api/chatApi";
import { useStompChat } from "@/shared/hooks/useStompChat";
import { useAuthStore } from "@/shared/store/authStore";
import styles from "@/components/user/product/ProductDetail.module.css";
import {
  apiGetBrandLikeStatus,
  apiGetItemLikeStatus,
  apiLikeBrand,
  apiLikeItem,
  apiUnlikeBrand,
  apiUnlikeItem,
} from "@/shared/api/likeApi";
import { apiGetBrandById } from "@/shared/api/brandApi";
import {
  apiGetItemDetail,
  apiGetShopItems,
  type ItemDetailResponse,
  type ShopItemResponse,
} from "@/shared/api/itemApi";
import {
  apiGetTradeDrawer,
  apiGetConcludedTrades,
  apiGetPendingSellBids,
  apiGetPendingBuyBids,
  apiGetPriceHistory,
  type TradeDrawerResponse,
  type ConcludedTradeResponse,
  type SellBidResponse,
  type BuyBidResponse,
  type ItemOptionResponse,
  type PageResult,
} from "@/shared/api/tradeApi";
import { apiGetItemReviews, apiSubmitReview, apiDeleteReview, apiReportReview, type ReviewResponse } from "@/shared/api/reviewApi";
import { useModalStore } from "@/shared/store/modalStore";

import { resolveUrl as resolveImg } from "@/shared/config/env";
import { sanitizeHtml } from "@/shared/utils/sanitizeHtml";
import { dummyLikeBase } from "@/shared/utils/dummyLike";

// 한국어 색상명 → hex 폴백 맵 (colorHex가 없는 경우 사용)
const COLOR_NAME_MAP: Record<string, string> = {
  블랙: "#111111", 검정: "#111111", "블랙 계열": "#111111",
  화이트: "#f9f9f9", 흰색: "#f9f9f9", 아이보리: "#f5f0e8", 크림: "#fffdd0",
  그레이: "#9ca3af", 회색: "#9ca3af", "다크 그레이": "#4b5563", "라이트 그레이": "#d1d5db", 차콜: "#374151",
  베이지: "#d4b896", "카키 베이지": "#b5a88a", 샌드: "#c2b280",
  네이비: "#1e3a5f", 네이비블루: "#1e3a5f",
  블루: "#3b82f6", 스카이블루: "#7dd3fc", "라이트 블루": "#bfdbfe", 파랑: "#3b82f6",
  레드: "#ef4444", 빨강: "#ef4444", 버건디: "#7f1d1d", 와인: "#6d1a1a",
  핑크: "#f9a8d4", 라이트핑크: "#fce7f3",
  옐로우: "#fbbf24", 노랑: "#fbbf24", 머스타드: "#ca8a04",
  오렌지: "#f97316", 주황: "#f97316",
  그린: "#22c55e", 초록: "#22c55e", "라이트 그린": "#86efac", 카키: "#6b7c3b", 올리브: "#708238", 세이지: "#9caf88",
  퍼플: "#a855f7", 보라: "#a855f7", 라벤더: "#c4b5fd",
  브라운: "#92400e", 갈색: "#92400e", 카멜: "#c19a6b",
  브릭: "#b45309", "브릭 레드": "#b45309",
  코랄: "#ff6b6b",
  민트: "#6ee7b7",
  멀티: "linear-gradient(135deg,#f00,#0f0,#00f)",
};

function resolveColorHex(colorHex: string | null | undefined, name: string): string | null {
  if (colorHex) return colorHex;
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(COLOR_NAME_MAP)) {
    if (lower.includes(k.toLowerCase())) return v;
  }
  return null;
}

type TradeTab = "concluded" | "sellBids" | "buyBids";
type DrawerRange = "1개월" | "3개월" | "6개월" | "1년" | "전체";

interface TradeEntry {
  size: string;
  price: number;
  date: string;
  count: number;
}

const DRAWER_RANGES: DrawerRange[] = ["1개월", "3개월", "6개월", "1년", "전체"];

function toConcludedEntry(t: ConcludedTradeResponse): TradeEntry {
  return { size: t.optionValue ?? "-", price: t.tradePrice, date: t.createdAt ?? "-", count: 1 };
}

function groupBidEntries(bids: (SellBidResponse | BuyBidResponse)[]): TradeEntry[] {
  const map = new Map<string, TradeEntry>();
  for (const b of bids) {
    const key = `${b.optionValue ?? "-"}__${b.price}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { size: b.optionValue ?? "-", price: b.price, date: b.createdAt ?? "-", count: 1 });
    }
  }
  return Array.from(map.values());
}

function Sparkline({ history }: { history: number[] }) {
  if (history.length < 2) return null;
  const width = 280, height = 60, padding = 4;
  const min = Math.min(...history), max = Math.max(...history);
  const range = max - min || 1;
  const points = history
    .map((value, index) => {
      const x = padding + (index / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke="#e65c00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TradeTable({ entries, tab }: { entries: TradeEntry[]; tab: TradeTab }) {
  if (entries.length === 0) {
    return <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>데이터가 없습니다.</div>;
  }
  if (tab === "concluded") {
    return (
      <table className={styles.tradeTable}>
        <thead><tr><th>옵션</th><th>거래가</th><th>거래일</th></tr></thead>
        <tbody>{entries.map((e, i) => (
          <tr key={i}>
            <td>{e.size}</td>
            <td className={styles.tradePrice}>{e.price.toLocaleString()}원</td>
            <td className={styles.tradeDate}>{e.date}</td>
          </tr>
        ))}</tbody>
      </table>
    );
  }
  if (tab === "sellBids") {
    return (
      <table className={styles.tradeTable}>
        <thead><tr><th>옵션</th><th>판매입찰가</th><th>수량</th></tr></thead>
        <tbody>{entries.map((e, i) => (
          <tr key={i}>
            <td>{e.size}</td>
            <td className={styles.tradePrice}>{e.price.toLocaleString()}원</td>
            <td>{e.count}</td>
          </tr>
        ))}</tbody>
      </table>
    );
  }
  return (
    <table className={styles.tradeTable}>
      <thead><tr><th>옵션</th><th>구매입찰가</th><th>수량</th></tr></thead>
      <tbody>{entries.map((e, i) => (
        <tr key={i}>
          <td>{e.size}</td>
          <td className={styles.tradePriceBuy}>{e.price.toLocaleString()}원</td>
          <td>{e.count}</td>
        </tr>
      ))}</tbody>
    </table>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const numId = Number(id);
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);

  // ─── 상품 데이터 ─────────────────────────────────────────────────────────────
  const [item, setItem] = useState<ItemDetailResponse | null>(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [itemError, setItemError] = useState(false);

  useEffect(() => {
    setItemLoading(true);
    setItemError(false);
    setItem(null);
    apiGetItemDetail(numId)
      .then(setItem)
      .catch(() => setItemError(true))
      .finally(() => setItemLoading(false));
  }, [numId]);

  // ─── 연관 상품 (같은 브랜드) ─────────────────────────────────────────────────
  const [brandItems, setBrandItems] = useState<ShopItemResponse[]>([]);
  const moveToBrandShop = useCallback(() => {
    if (!item?.brandId) return;
    navigate(`/shop?brandCode=${encodeURIComponent(String(item.brandId))}`);
  }, [item?.brandId, navigate]);

  useEffect(() => {
    if (!item?.brandId || !item?.id) {
      setBrandItems([]);
      return;
    }
    apiGetShopItems({
      page: 0,
      size: 8,
      brandCode: String(item.brandId),
    })
      .then((res) =>
        setBrandItems(
          res.content.filter((p) => p.id !== item.id).slice(0, 6),
        ),
      )
      .catch(() => setBrandItems([]));
  }, [item?.brandId, item?.id]);

  // ─── 좋아요 ─────────────────────────────────────────────────────────────────
  const [itemLiked, setItemLiked] = useState(false);
  const [itemLikeCnt, setItemLikeCnt] = useState(0);
  const [brandLiked, setBrandLiked] = useState(false);
  const [brandLikeCnt, setBrandLikeCnt] = useState(0);

  // 상품 좋아요 수: 상품 로드 시 dummyLikeBase + item.likeCnt 로 초기화, 이후 API 응답으로 동기화
  useEffect(() => {
    if (!item) return;
    setItemLikeCnt(dummyLikeBase(item.id) + (item.likeCnt ?? 0));
    apiGetItemLikeStatus(item.id)
      .then((r) => { setItemLiked(r.liked); setItemLikeCnt(dummyLikeBase(item.id) + r.likeCnt); })
      .catch(() => {});
  }, [item?.id]);

  // 브랜드 좋아요 수 + 상태: 병렬로 한 번에 요청
  useEffect(() => {
    if (!item?.brandId) return;
    Promise.all([
      apiGetBrandById(item.brandId),
      apiGetBrandLikeStatus(item.brandId),
    ])
      .then(([brand, likeStatus]) => {
        if (brand.likeCnt != null) setBrandLikeCnt(brand.likeCnt);
        setBrandLiked(likeStatus.liked);
      })
      .catch(() => {});
  }, [item?.brandId]);

  async function handleLikeItem() {
    if (!item) return;
    try {
      const r = await apiLikeItem(item.id);
      setItemLiked(r.liked);
      setItemLikeCnt(dummyLikeBase(item.id) + r.likeCnt);
    } catch {}
  }
  async function handleUnlikeItem() {
    if (!item) return;
    try {
      const r = await apiUnlikeItem(item.id);
      setItemLiked(r.liked);
      setItemLikeCnt(dummyLikeBase(item.id) + r.likeCnt);
    } catch {}
  }
  async function handleLikeBrand() {
    if (!item?.brandId) return;
    try {
      const r = await apiLikeBrand(item.brandId);
      setBrandLiked(r.liked);
      setBrandLikeCnt(r.likeCnt);
    } catch {}
  }
  async function handleUnlikeBrand() {
    if (!item?.brandId) return;
    try {
      const r = await apiUnlikeBrand(item.brandId);
      setBrandLiked(r.liked);
      setBrandLikeCnt(r.likeCnt);
    } catch {}
  }

  // ─── 이미지 ──────────────────────────────────────────────────────────────────
  const allImages = useMemo(
    () => (item ? [item.img, ...item.subImgs].filter(Boolean) as string[] : []),
    [item],
  );
  const [mainImgIdx, setMainImgIdx] = useState(0);

  // ─── 거래 / 드로어 상태 ───────────────────────────────────────────────────────
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [tradeTab, setTradeTab] = useState<TradeTab>("concluded");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<TradeTab>("concluded");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [drawerSize, setDrawerSize] = useState("모든 옵션");
  const [drawerRange, setDrawerRange] = useState<DrawerRange>("1개월");
  const [drawerData, setDrawerData] = useState<TradeDrawerResponse | null>(null);
  const [drawerOptionId, setDrawerOptionId] = useState<number | null>(null);
  const [concludedData, setConcludedData] = useState<PageResult<ConcludedTradeResponse> | null>(null);
  const [sellBidData, setSellBidData] = useState<PageResult<SellBidResponse> | null>(null);
  const [buyBidData, setBuyBidData] = useState<PageResult<BuyBidResponse> | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [showBuyBidModal, setShowBuyBidModal] = useState(false);
  const [showSellBidModal, setShowSellBidModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);

  // ─── 상품 상세 더보기 ────────────────────────────────────────────────────
  const [descExpanded, setDescExpanded] = useState(false);

  // ─── 단체채팅 ─────────────────────────────────────────────────────────────
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [groupRoomId, setGroupRoomId] = useState<number | null>(null);
  const [groupChatInput, setGroupChatInput] = useState("");
  const [reportingMsgId, setReportingMsgId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const groupChatScrollRef = useRef<HTMLDivElement>(null);
  const meChat = useAuthStore((s) => s.me);
  const { messages: groupChatMessages, sendMessage: sendGroupChatMsg, connected: groupChatConnected } =
    useStompChat(groupRoomId);

  useEffect(() => {
    if (groupChatScrollRef.current)
      groupChatScrollRef.current.scrollTop = groupChatScrollRef.current.scrollHeight;
  }, [groupChatMessages]);

  function requireLogin(action: () => void) {
    if (!meChat) {
      openConfirm(
        "warning",
        "로그인이 필요합니다",
        "이 기능은 로그인 후 이용 가능합니다.\n로그인 페이지로 이동하시겠습니까?",
        () => navigate("/login"),
        "로그인하기",
        "취소",
      );
      return false;
    }
    action();
    return true;
  }

  function openGroupChat() {
    if (!item) return;
    requireLogin(() => {
      apiGetGroupRoom(item.id)
        .then((room) => { setGroupRoomId(room.id); setShowGroupChat(true); })
        .catch(() => {});
    });
  }

  function sendGroupChat() {
    if (!groupChatInput.trim()) return;
    const sent = sendGroupChatMsg(groupChatInput.trim());
    if (sent) setGroupChatInput("");
  }

  function submitChatReport() {
    if (!reportingMsgId || !reportReason.trim()) return;
    apiReportMessage(reportingMsgId, reportReason.trim())
      .then(() => {
        setReportingMsgId(null);
        setReportReason("");
        openAlert("success", "신고 접수", "신고가 접수되었습니다.");
      })
      .catch(() => openAlert("error", "오류", "신고 중 오류가 발생했습니다."));
  }

  // ─── 리뷰 ─────────────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  async function handleDeleteReview(reviewId: number) {
    openConfirm("warning", "리뷰 삭제", "이 리뷰를 삭제하시겠습니까?", async () => {
      try {
        await apiDeleteReview(reviewId);
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } catch {
        openAlert("error", "삭제 실패", "리뷰 삭제에 실패했습니다.");
      }
    }, "삭제", "취소");
  }

  async function handleReportReview(reviewId: number) {
    const reason = window.prompt("신고 사유를 입력해주세요:");
    if (!reason?.trim()) return;
    try {
      await apiReportReview(reviewId, reason.trim());
      openAlert("success", "신고 완료", "리뷰 신고가 접수되었습니다.");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      openAlert("error", "신고 실패", msg ?? "이미 신고한 리뷰이거나 오류가 발생했습니다.");
    }
  }

  const loadReviews = useCallback(async () => {
    if (!item) return;
    setReviewsLoading(true);
    try {
      const res = await apiGetItemReviews(item.id);
      setReviews(res.content);
    } catch {
      // 무시
    } finally {
      setReviewsLoading(false);
    }
  }, [item?.id]);

  const loadDrawerData = useCallback(
    async (optId: number | null, range: DrawerRange) => {
      if (!item) return;
      setDrawerLoading(true);
      try {
        const [drawer, history] = await Promise.all([
          apiGetTradeDrawer(item.id, optId),
          apiGetPriceHistory(item.id, range, optId),
        ]);
        setDrawerData({ ...drawer, priceHistory: history });
      } catch {
        // 무시
      } finally {
        setDrawerLoading(false);
      }
    },
    [item?.id],
  );

  const loadPriceHistoryOnly = useCallback(
    async (optId: number | null, range: DrawerRange) => {
      if (!item) return;
      try {
        const history = await apiGetPriceHistory(item.id, range, optId);
        setDrawerData((prev) => (prev ? { ...prev, priceHistory: history } : prev));
      } catch {
        // 무시
      }
    },
    [item?.id],
  );

  const loadTabData = useCallback(
    async (tab: TradeTab, optId: number | null) => {
      if (!item) return;
      try {
        if (tab === "concluded") setConcludedData(await apiGetConcludedTrades(item.id, optId));
        else if (tab === "sellBids") setSellBidData(await apiGetPendingSellBids(item.id, optId));
        else setBuyBidData(await apiGetPendingBuyBids(item.id, optId));
      } catch {}
    },
    [item?.id],
  );

  // 상품 로드 완료 후 초기 거래 데이터 + 리뷰 로드
  useEffect(() => {
    if (!item) return;
    void loadDrawerData(null, drawerRange);
    void loadTabData("concluded", null);
    void loadReviews();
  }, [item?.id]);

  // 드로어 열릴 때: 데이터가 없는 경우에만 로드 (이미 초기 로드됨)
  useEffect(() => {
    if (drawerOpen && drawerData === null) {
      void loadDrawerData(drawerOptionId, drawerRange);
      void loadTabData(drawerTab, drawerOptionId);
    }
  }, [drawerOpen]);

  // 기간 변경 시 가격 히스토리만 재로드 (거래 드로어 데이터 불필요)
  useEffect(() => {
    if (drawerOpen) void loadPriceHistoryOnly(drawerOptionId, drawerRange);
  }, [drawerRange]);

  function handleDrawerOptionChange(optionValue: string) {
    setDrawerSize(optionValue);
    const opt = drawerData?.options.find((o) => o.optionValue === optionValue) ?? null;
    const newOptId = opt?.id ?? null;
    setDrawerOptionId(newOptId);
    void loadDrawerData(newOptId, drawerRange);
    void loadTabData(drawerTab, newOptId);
  }

  function handleDrawerTabChange(tab: TradeTab) {
    setDrawerTab(tab);
    void loadTabData(tab, drawerOptionId);
  }

  function handleTradeTabChange(tab: TradeTab) {
    setTradeTab(tab);
    void loadTabData(tab, null);
  }

  // ─── 파생 데이터 ─────────────────────────────────────────────────────────────
  const realDrawerEntries: TradeEntry[] = useMemo(() => {
    if (drawerTab === "concluded" && concludedData) return concludedData.content.map(toConcludedEntry);
    if (drawerTab === "sellBids" && sellBidData) return groupBidEntries(sellBidData.content);
    if (drawerTab === "buyBids" && buyBidData) return groupBidEntries(buyBidData.content);
    return [];
  }, [drawerTab, concludedData, sellBidData, buyBidData]);

  const inlineEntries: TradeEntry[] = useMemo(() => {
    if (tradeTab === "concluded" && concludedData) return concludedData.content.slice(0, 5).map(toConcludedEntry);
    if (tradeTab === "sellBids" && sellBidData) return groupBidEntries(sellBidData.content).slice(0, 5);
    if (tradeTab === "buyBids" && buyBidData) return groupBidEntries(buyBidData.content).slice(0, 5);
    return [];
  }, [tradeTab, concludedData, sellBidData, buyBidData]);

  const chartData = useMemo(
    () => (drawerData?.priceHistory?.length ? drawerData.priceHistory.map((p) => p.price) : []),
    [drawerData],
  );

  const drawerOptions: ItemOptionResponse[] = drawerData?.options ?? [];
  const drawerSizes = ["모든 옵션", ...drawerOptions.map((o) => o.optionValue)];
  const instantBuyPrice = drawerData?.instantBuyPrice ?? null;
  const instantSellPrice = drawerData?.instantSellPrice ?? null;
  const sanitizedDescription = useMemo(() => sanitizeHtml(item?.description ?? ""), [item?.description]);

  // BOTH 아이템: URL ?mode=auction → 입찰 뷰, 그 외 → 렌탈 뷰
  const urlMode = searchParams.get("mode");
  const effectiveMode: "auction" | "rental" =
    item?.itemMode === "BOTH"
      ? urlMode === "auction"
        ? "auction"
        : "rental"
      : item?.itemMode === "AUCTION"
        ? "auction"
        : "rental";

  const showAuctionUi =
    item?.itemMode === "AUCTION" || (item?.itemMode === "BOTH" && effectiveMode === "auction");
  const showRentalUi =
    item?.itemMode === "RENTAL" || (item?.itemMode === "BOTH" && effectiveMode === "rental");

  // ─── 로딩 / 에러 ─────────────────────────────────────────────────────────────
  if (itemLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px", fontSize: "16px", color: "#888" }}>
        상품 정보를 불러오는 중...
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px", gap: "16px" }}>
        <div style={{ fontSize: "48px" }}>😕</div>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>상품을 찾을 수 없습니다.</div>
        <div style={{ fontSize: "14px", color: "#888" }}>삭제되었거나 존재하지 않는 상품입니다.</div>
        <button
          type="button"
          onClick={() => navigate("/shop")}
          style={{
            marginTop: "8px", padding: "10px 24px", background: "#111", color: "#fff",
            border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px",
          }}
        >
          쇼핑 계속하기
        </button>
      </div>
    );
  }

  const mainImgUrl = allImages.length > 0 ? resolveImg(allImages[mainImgIdx]) : "";

  return (
    <>
      {/* ─── 거래 드로어 ──────────────────────────────────────────────────────── */}
      <div className={`${styles.tradeDrawer} ${drawerOpen ? styles.tradeDrawerOpen : ""}`}>
        <div className={styles.tradeDrawerHeader}>
          <span className={styles.tradeDrawerClose} role="button" tabIndex={0} onClick={() => setDrawerOpen(false)}>
            ×
          </span>
          <span className={styles.tradeDrawerTitle}>거래 및 입찰 내역</span>
        </div>

        <div className={styles.tradeDrawerScroll}>
          <div className={styles.tradeDrawerProduct}>
            {item.img ? (
              <img
                src={resolveImg(item.img)}
                alt={item.name}
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
              />
            ) : (
              <div style={{ width: 60, height: 60, background: "#f0f0f0", borderRadius: 6 }} />
            )}
            <div>
              <div className={styles.tradeDrawerProductBrand}>{item.brand}</div>
              <div className={styles.tradeDrawerProductName}>{item.name}</div>
              <div className={styles.tradeDrawerProductId}>{item.itemNo}</div>
            </div>
          </div>

          <div className={styles.tradeDrawerSection}>
            <select
              className={styles.tradeDrawerSizeSelect}
              value={drawerSize}
              onChange={(e) => handleDrawerOptionChange(e.target.value)}
            >
              {drawerSizes.map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </div>

          {chartData.length > 0 && (
            <div className={styles.tradeDrawerSection}>
              <div className={styles.tradeDrawerPriceLabel}>
                최근 시세 –{" "}
                {`${(chartData[chartData.length - 1] ?? 0).toLocaleString()}원`}
              </div>
              <div className={styles.tradeChartRanges}>
                {DRAWER_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`${styles.tradeChartRangeBtn} ${drawerRange === range ? styles.tradeChartRangeBtnActive : ""}`}
                    onClick={() => setDrawerRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <div className={styles.tradeChartWrap}>
                <Sparkline history={chartData} />
              </div>
              <div className={styles.tradeChartMinmax}>
                <span>{Math.min(...chartData).toLocaleString()}원</span>
                <span>{Math.max(...chartData).toLocaleString()}원</span>
              </div>
            </div>
          )}

          <div className={styles.tradeDrawerSection}>
            <div className={styles.tradeDrawerTabs}>
              {(["concluded", "sellBids", "buyBids"] as TradeTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tradeDrawerTab} ${drawerTab === tab ? styles.tradeDrawerTabActive : ""}`}
                  onClick={() => handleDrawerTabChange(tab)}
                >
                  {tab === "concluded" ? "체결 거래" : tab === "sellBids" ? "판매 입찰" : "구매 입찰"}
                </button>
              ))}
            </div>
            {drawerLoading ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                불러오는 중...
              </div>
            ) : (
              <TradeTable entries={realDrawerEntries} tab={drawerTab} />
            )}
          </div>
        </div>

        <div className={styles.tradeDrawerFooter}>
          <button type="button" className={styles.tradeInstantSellBtn} onClick={() => requireLogin(() => setShowSellBidModal(true))}>
            <div className={styles.tradeInstantLabel}>즉시 판매가</div>
            <div className={styles.tradeInstantPrice}>
              {instantSellPrice != null && instantSellPrice > 0
                ? `${instantSellPrice.toLocaleString()}원`
                : "-"}
            </div>
          </button>
          <button type="button" className={styles.tradeInstantBuyBtn} onClick={() => requireLogin(() => setShowBuyBidModal(true))}>
            <div className={styles.tradeInstantLabel}>즉시 구매가</div>
            <div className={styles.tradeInstantPrice}>
              {instantBuyPrice != null && instantBuyPrice > 0
                ? `${instantBuyPrice.toLocaleString()}원`
                : "-"}
            </div>
          </button>
        </div>
      </div>

      {/* ─── 상품 상세 본문 ───────────────────────────────────────────────────── */}
      <div className={styles.detailPage}>
        {/* 브랜드 헤더 */}
        <div className={styles.detailBrandHeader}>
          <div className={styles.detailBrandAvatar}>
            {item.brandIconImageUrl ? (
              <img
                src={resolveImg(item.brandIconImageUrl) ?? undefined}
                alt={item.brand}
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }}
              />
            ) : (
              "🏷️"
            )}
          </div>
          <div className={styles.detailBrandHeaderInfo}>
            <div className={styles.detailBrandHeaderName}>
              <span
                role="button"
                tabIndex={0}
                onClick={moveToBrandShop}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") moveToBrandShop();
                }}
                style={{ cursor: "pointer" }}
              >
                {item.brand}
              </span>
              {item.brandId && (
                <FavoriteButton
                  liked={brandLiked}
                  onLike={handleLikeBrand}
                  onUnlike={handleUnlikeBrand}
                  className={styles.detailBrandHeartBtn}
                  ariaLabel={`${item.brand} 브랜드 좋아요`}
                  unlikeMessage={`${item.brand} 브랜드 좋아요를 취소하시겠습니까?`}
                />
              )}
            </div>
            <div className={styles.detailBrandHeaderSub}>
              {item.brand} · 관심 {brandLikeCnt.toLocaleString()}
            </div>
          </div>
        </div>

        <div className={styles.detailLayout}>
          {/* 이미지 갤러리 */}
          <div className={styles.detailGallery}>
            <div className={styles.detailMainImg}>
              {mainImgUrl ? (
                <img
                  src={mainImgUrl}
                  alt={item.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%", height: "100%", background: "#f5f5f5",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px",
                  }}
                >
                  📦
                </div>
              )}
            </div>
            <div className={styles.detailSubImgs} style={allImages.length > 5 ? { overflowX: "auto", flexWrap: "nowrap" } : undefined}>
              {allImages.map((url, index) => (
                <div
                  key={index}
                  className={`${styles.detailSubImg} ${index === mainImgIdx ? styles.detailSubImgActive : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setMainImgIdx(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setMainImgIdx(index);
                  }}
                >
                  <img
                    src={resolveImg(url)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 상품 정보 */}
          <div className={styles.detailInfo}>
            {/* BOTH 아이템: 입찰 / 렌탈 페이지 전환 토글 */}
            {item.itemMode === "BOTH" && (
              <div className={styles.modeToggle}>
                <button
                  type="button"
                  className={`${styles.modeToggleBtn} ${effectiveMode === "rental" ? styles.modeToggleBtnActive : ""}`}
                  onClick={() => navigate(`/product/${id}?mode=rental`)}
                >
                  렌탈 페이지
                </button>
                <button
                  type="button"
                  className={`${styles.modeToggleBtn} ${effectiveMode === "auction" ? styles.modeToggleBtnActive : ""}`}
                  onClick={() => navigate(`/product/${id}?mode=auction`)}
                >
                  입찰 페이지
                </button>
              </div>
            )}
            <div>
              <div
                className={styles.detailBrandName}
                role="button"
                tabIndex={0}
                onClick={moveToBrandShop}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") moveToBrandShop();
                }}
                style={{ cursor: "pointer" }}
              >
                {item.brand}
              </div>
              <div className={styles.detailNameRow}>
                <div className={styles.detailName}>{item.name}</div>
                <div className={styles.detailNameLikeWrap}>
                  <FavoriteButton
                    liked={itemLiked}
                    onLike={handleLikeItem}
                    onUnlike={handleUnlikeItem}
                    className={styles.detailNameLikeBtn}
                    ariaLabel={`${item.name} 좋아요`}
                    unlikeMessage={`${item.name} 좋아요를 취소하시겠습니까?`}
                  />
                  <span className={styles.detailNameLikeCnt}>{itemLikeCnt.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>{item.itemNo}</div>
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>출시가</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>
                  {item.retailPrice.toLocaleString()}원
                </div>
              </div>
              {item.tagGroups.length > 0 && (() => {
                const EXCLUDED = new Set(["가격", "스타일", "주요소재", "패턴/무늬", "라인업", "상세옵션"]);
                function sizeKey(name: string) {
                  if (name.includes("이하")) return (parseInt(name) || 0) - 0.5;
                  if (name.includes("이상")) return (parseInt(name) || 9998) + 0.5;
                  const n = parseInt(name);
                  return isNaN(n) ? 9999 : n;
                }
                const visibleGroups = item.tagGroups.filter((g) => !EXCLUDED.has(g.groupName));
                if (visibleGroups.length === 0) return null;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                    {visibleGroups.map((group) => {
                      const isSizeGroup = group.groupName.includes("사이즈");
                      const tagStyle = {
                        display: "inline-flex" as const,
                        alignItems: "center" as const,
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "#f3f4f6",
                        color: "#374151",
                        fontSize: 12,
                        fontWeight: 600,
                      };
                      return (
                        <div key={group.groupId} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>{group.groupName}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {isSizeGroup ? (() => {
                              const sorted = [...group.tags].sort((a, b) => sizeKey(a.name) - sizeKey(b.name));
                              const first = sorted[0];
                              const last = sorted[sorted.length - 1];
                              if (!first) return null;
                              const label = first === last ? `#${first.name}` : `#${first.name}~${last.name}`;
                              return <span style={tagStyle}>{label}</span>;
                            })() : group.tags.map((tag) => {
                              const hex = resolveColorHex(tag.colorHex, tag.name);
                              return (
                                <span key={tag.id} style={tagStyle}>
                                  {hex && (
                                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: hex, border: "1px solid #d1d5db", flexShrink: 0 }} />
                                  )}
                                  #{tag.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {showAuctionUi && (
              <>
                <div className={styles.detailInstantPrices}>
                  <div className={styles.detailInstantItem}>
                    <div className={styles.detailInstantLabel}>즉시 구매가</div>
                    <div className={`${styles.detailInstantVal} ${styles.detailInstantValBuy}`}>
                      {instantBuyPrice != null && instantBuyPrice > 0
                        ? `${instantBuyPrice.toLocaleString()}원`
                        : "-"}
                    </div>
                  </div>
                  <div className={styles.detailInstantDivider} />
                  <div className={styles.detailInstantItem}>
                    <div className={styles.detailInstantLabel}>즉시 판매가</div>
                    <div className={`${styles.detailInstantVal} ${styles.detailInstantValSell}`}>
                      {instantSellPrice != null && instantSellPrice > 0
                        ? `${instantSellPrice.toLocaleString()}원`
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className={styles.detailDivider} />
              </>
            )}

            {drawerOptions.length > 0 && (
              <div>
                <div className={styles.detailSizeTitle}>사이즈 선택</div>
                <div className={styles.detailSizes}>
                  {drawerOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`${styles.detailSizeBtn} ${selectedOptionId === String(opt.id) ? styles.detailSizeBtnActive : ""}`}
                      onClick={() =>
                        setSelectedOptionId((prev) => (prev === String(opt.id) ? null : String(opt.id)))
                      }
                    >
                      {opt.optionValue}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.detailTradeActions}>
              {showRentalUi ? (
                <button
                  type="button"
                  className={styles.detailBtnBuyNew}
                  style={{ background: "#0d9488", borderColor: "#0d9488", flex: 1 }}
                  onClick={() => requireLogin(() => setShowRentalModal(true))}
                >
                  <span className={styles.detailTradeBtnLabel}>렌탈</span>
                  <span className={styles.detailTradeBtnSub}>
                    {item.rentalPrice != null && item.rentalPrice > 0
                      ? `${item.rentalPrice.toLocaleString()}원/일`
                      : "가격 문의"}
                  </span>
                </button>
              ) : (
                <>
                  <button type="button" className={styles.detailBtnSell} onClick={() => requireLogin(() => setShowSellBidModal(true))}>
                    <span className={styles.detailTradeBtnLabel}>판매</span>
                    <span className={styles.detailTradeBtnSub}>
                      {instantSellPrice != null && instantSellPrice > 0 ? `${instantSellPrice.toLocaleString()}원` : "-"}
                    </span>
                  </button>
                  <button type="button" className={styles.detailBtnBuyNew} onClick={() => requireLogin(() => setShowBuyBidModal(true))}>
                    <span className={styles.detailTradeBtnLabel}>구매</span>
                    <span className={styles.detailTradeBtnSub}>
                      {instantBuyPrice != null && instantBuyPrice > 0 ? `${instantBuyPrice.toLocaleString()}원` : "-"}
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* 아이템 단체채팅 */}
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={openGroupChat}
                style={{
                  width: "100%", padding: "10px 0", border: "1px solid #e5e7eb",
                  borderRadius: 8, background: "#fff", fontSize: 13, fontWeight: 600,
                  color: "#374151", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                }}
              >
                아이템 채팅방 참여
              </button>
            </div>

            {showAuctionUi && (
              <>
                <div className={styles.detailDivider} />
                <div className={styles.tradeSection}>
                  <div className={styles.tradeTabsBar}>
                    {(["concluded", "sellBids", "buyBids"] as TradeTab[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={`${styles.tradeTabBtn} ${tradeTab === tab ? styles.tradeTabBtnActive : ""}`}
                        onClick={() => handleTradeTabChange(tab)}
                      >
                        {tab === "concluded" ? "체결거래" : tab === "sellBids" ? "판매입찰" : "구매입찰"}
                      </button>
                    ))}
                  </div>
                  <TradeTable entries={inlineEntries} tab={tradeTab} />
                  <button type="button" className={styles.tradeMoreBtn} onClick={() => setDrawerOpen(true)}>
                    거래내역 더보기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 같은 브랜드 상품 */}
        {brandItems.length > 0 && (
          <div className={styles.detailRelatedSection}>
            <div className={styles.detailSectionHeader}>
              <span className={styles.detailSectionTitle}>이 브랜드의 다른 상품</span>
              <span
                className={styles.detailSectionMore}
                role="button"
                tabIndex={0}
                onClick={moveToBrandShop}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") moveToBrandShop();
                }}
              >
                더보기 &gt;
              </span>
            </div>
            <div className={styles.detailRelatedScroll}>
              {brandItems.map((entry) => (
                <div
                  key={entry.id}
                  className={styles.detailRelatedCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/product/${entry.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") navigate(`/product/${entry.id}`);
                  }}
                >
                  <div className={styles.detailRelatedImg}>
                    {entry.img ? (
                      <img
                        src={resolveImg(entry.img)}
                        alt={entry.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%", height: "100%", background: "#f5f5f5",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        📦
                      </div>
                    )}
                  </div>
                  <div className={styles.detailRelatedBrand}>{entry.brand}</div>
                  <div className={styles.detailRelatedName}>{entry.name}</div>
                  <div className={styles.detailRelatedPrice}>{entry.retailPrice.toLocaleString()}원</div>
                  <div className={styles.detailRelatedLikes}>관심 {entry.likeCnt ?? 0}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.detailDivider} style={{ margin: "40px 0" }} />

        {/* 상품 상세 HTML */}
        <div className={styles.descSection}>
          <div className={styles.descHeader}>
            <span className={styles.descTitle}>상품 상세</span>
          </div>
          {item.description ? (
            <div style={{ position: "relative" }}>
              <div
                className={styles.descContent}
                style={descExpanded ? undefined : { maxHeight: 500, overflow: "hidden" }}
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
              {!descExpanded && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: 120,
                  background: "linear-gradient(to bottom, transparent, #fff)",
                  pointerEvents: "none",
                }} />
              )}
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                style={{
                  display: "block", width: "100%", marginTop: descExpanded ? 16 : 0,
                  padding: "14px 0", border: "1px solid #e5e7eb", borderRadius: 8,
                  background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151",
                  cursor: "pointer", textAlign: "center",
                }}
              >
                {descExpanded ? "상품 정보 접기 ∧" : "상품 정보 더보기 ∨"}
              </button>
            </div>
          ) : (
            <div className={styles.descEmpty}>
              <p>상품 상세 설명이 없습니다.</p>
            </div>
          )}
        </div>

        <div className={styles.detailDivider} style={{ margin: "40px 0" }} />

        {/* 리뷰 */}
        <div>
          <div className={styles.detailReviewHeader}>
            <span className={styles.detailReviewTitle}>리뷰 ({reviews.length})</span>
            <button type="button" className={styles.reviewWriteBtn} onClick={() => setReviewModalOpen(true)}>
              리뷰 작성
            </button>
          </div>
          {reviewsLoading ? (
            <p style={{ fontSize: "13px", color: "#888", padding: "20px 0" }}>리뷰를 불러오는 중...</p>
          ) : reviews.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#888", padding: "20px 0" }}>
              아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ border: "1px solid #eee", borderRadius: "10px", padding: "16px", background: "#fafafa" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ color: "#e65c00", fontSize: "14px" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{r.memberName}</span>
                    <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "auto" }}>{r.createdAt}</span>
                    {meChat &&
                      (meChat.id === r.memberId ||
                        meChat.roles?.includes("ADMIN") ||
                        meChat.roles?.includes("ROLE_ADMIN")) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(r.id)}
                        style={{ fontSize: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
                      >삭제</button>
                    )}
                    {meChat && meChat.id !== r.memberId && (
                      <button
                        type="button"
                        onClick={() => handleReportReview(r.id)}
                        style={{ fontSize: "12px", color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
                      >신고</button>
                    )}
                  </div>
                  {(r.size || r.height || r.weight) && (
                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                      {r.size && <span>사이즈: {r.size} </span>}
                      {r.height && <span>키: {r.height}cm </span>}
                      {r.weight && <span>몸무게: {r.weight}kg</span>}
                    </div>
                  )}
                  <p style={{ fontSize: "14px", color: "#333", margin: "0 0 8px" }}>{r.content}</p>
                  {r.photoUrl && (
                    <img
                      src={resolveImg(r.photoUrl)}
                      alt="리뷰 사진"
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "6px" }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReviewModal
        isOpen={reviewModalOpen}
        productName={item.name}
        productSizes={drawerOptions.map((o) => o.optionValue)}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={async (data: ReviewFormData) => {
          try {
            await apiSubmitReview(
              item.id,
              data.rating,
              data.text,
              data.photo,
              data.size,
              data.height,
              data.weight,
            );
            setReviewModalOpen(false);
            void loadReviews();
          } catch {
            openAlert("error", "리뷰 등록 실패", "리뷰 등록에 실패했습니다. 다시 시도해주세요.");
          }
        }}
      />

      {showBuyBidModal && (
        <BuyBidModal
          itemId={item.id}
          itemName={item.name}
          options={drawerOptions}
          selectedOptionId={drawerOptionId}
          instantSellPrice={instantSellPrice}
          onClose={() => setShowBuyBidModal(false)}
          onSuccess={() => {
            setShowBuyBidModal(false);
            void loadDrawerData(drawerOptionId, drawerRange);
            void loadTabData(drawerTab, drawerOptionId);
          }}
        />
      )}

      {showSellBidModal && (
        <SellBidModal
          itemId={item.id}
          itemName={item.name}
          options={drawerOptions}
          selectedOptionId={drawerOptionId}
          onClose={() => setShowSellBidModal(false)}
          onSuccess={() => {
            setShowSellBidModal(false);
            void loadDrawerData(drawerOptionId, drawerRange);
            void loadTabData(drawerTab, drawerOptionId);
          }}
        />
      )}

      {showRentalModal && (
        <RentalModal
          itemId={item.id}
          itemName={item.name}
          rentalPrice={item.rentalPrice ?? 0}
          onClose={() => setShowRentalModal(false)}
          onSuccess={() => setShowRentalModal(false)}
        />
      )}

      {/* 채팅 메시지 신고 모달 — 채팅 팝업 바깥 최상위에 렌더링 */}
      {reportingMsgId !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300,
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px 20px", width: 300,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>메시지 신고</div>
            <textarea
              placeholder="신고 사유를 입력하세요..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, resize: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setReportingMsgId(null); setReportReason(""); }}
                style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13, cursor: "pointer" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitChatReport}
                disabled={!reportReason.trim()}
                style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !reportReason.trim() ? 0.5 : 1 }}
              >
                신고
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 단체채팅 모달 */}
      {showGroupChat && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1200,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 12px",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16,
            width: "min(380px, 100%)", height: "min(520px, 90vh)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            <div style={{
              padding: "14px 16px", background: "#111827", color: "#fff",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 700, minWidth: 0,
            }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.name} 채팅방
              </span>
              <button onClick={() => setShowGroupChat(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>✕</button>
            </div>
            <div ref={groupChatScrollRef} style={{
              flex: 1, overflowY: "auto", padding: 14,
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {groupChatMessages.length === 0 && (
                <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 40 }}>
                  첫 번째 메시지를 보내보세요!
                </div>
              )}
              {groupChatMessages.map((m) => {
                const isMe = m.senderName === meChat?.name || (meChat?.id != null && m.senderId === meChat.id);
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 6, alignItems: "flex-end" }}>
                    {!isMe && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, paddingBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "#6b7280" }}>{m.senderName}</span>
                        <button
                          type="button"
                          onClick={() => setReportingMsgId(m.id)}
                          title="신고"
                          style={{ fontSize: 10, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                        >
                          ⚑
                        </button>
                      </div>
                    )}
                    <div style={{
                      maxWidth: "70%", padding: "9px 12px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: isMe ? "#111827" : "#f1f5f9", color: isMe ? "#fff" : "#111",
                      fontSize: 13, lineHeight: 1.5,
                    }}>
                      {m.content}
                      <div style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.6)" : "#94a3b8", marginTop: 3, textAlign: "right" }}>
                        {new Date(m.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid #e5e7eb" }}>
              <input
                style={{ flex: 1, height: 36, padding: "0 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none" }}
                placeholder={groupChatConnected ? "메시지를 입력하세요..." : "연결 중..."}
                value={groupChatInput}
                onChange={(e) => setGroupChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendGroupChat(); }}
                disabled={!groupChatConnected}
              />
              <button
                onClick={sendGroupChat}
                disabled={!groupChatConnected || !groupChatInput.trim()}
                style={{
                  height: 36, padding: "0 14px", background: "#111827", color: "#fff",
                  border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  opacity: (!groupChatConnected || !groupChatInput.trim()) ? 0.5 : 1,
                }}
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
