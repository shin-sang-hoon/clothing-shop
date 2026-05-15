import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveUrl } from "@/shared/config/env";
import {
  apiGetMyBuyBids,
  apiGetMySellBids,
  apiGetMyConcludedBuyTrades,
  apiGetMyConcludedSellTrades,
  apiCancelBuyBid,
  apiCancelSellBid,
  type BuyBidResponse,
  type SellBidResponse,
  type ConcludedTradeResponse,
} from "@/shared/api/tradeApi";
import styles from "@/pages/MyPage.module.css";
import StatusBadge from "./StatusBadge";

type BidTab = "buy" | "sell" | "concluded";

const TAB_LABELS: Record<BidTab, string> = {
  buy: "구매입찰",
  sell: "판매입찰",
  concluded: "체결 거래",
};

function ItemThumb({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  return (
    <div className={styles.itemThumb}>
      {imageUrl ? (
        <img
          src={resolveUrl(imageUrl)}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : null}
    </div>
  );
}

export default function BidSection() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<BidTab>("buy");
  const [buyBids, setBuyBids] = useState<BuyBidResponse[]>([]);
  const [sellBids, setSellBids] = useState<SellBidResponse[]>([]);
  const [concludedBuy, setConcludedBuy] = useState<ConcludedTradeResponse[]>([]);
  const [concludedSell, setConcludedSell] = useState<ConcludedTradeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    if (tab === "buy") {
      apiGetMyBuyBids(0, 50)
        .then((r) => setBuyBids(r.content))
        .catch(() => setBuyBids([]))
        .finally(() => setLoading(false));
    } else if (tab === "sell") {
      apiGetMySellBids(0, 50)
        .then((r) => setSellBids(r.content))
        .catch(() => setSellBids([]))
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        apiGetMyConcludedBuyTrades(0, 50),
        apiGetMyConcludedSellTrades(0, 50),
      ])
        .then(([buy, sell]) => {
          setConcludedBuy(buy.content);
          setConcludedSell(sell.content);
        })
        .catch(() => {
          setConcludedBuy([]);
          setConcludedSell([]);
        })
        .finally(() => setLoading(false));
    }
  }, [tab]);

  async function handleCancelBuyBid(e: React.MouseEvent, bidId: number) {
    e.stopPropagation();
    if (!window.confirm("구매 입찰을 취소하시겠습니까?\n결제하신 금액은 환불 처리됩니다.")) return;
    setCancellingId(bidId);
    try {
      await apiCancelBuyBid(bidId);
      setBuyBids((prev) => prev.map((b) => b.id === bidId ? { ...b, status: "CANCELLED" } : b));
    } catch {
      alert("취소 처리 중 오류가 발생했습니다.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleCancelSellBid(e: React.MouseEvent, bidId: number) {
    e.stopPropagation();
    if (!window.confirm("판매 입찰을 취소하시겠습니까?")) return;
    setCancellingId(bidId);
    try {
      await apiCancelSellBid(bidId);
      setSellBids((prev) => prev.map((b) => b.id === bidId ? { ...b, status: "CANCELLED" } : b));
    } catch {
      alert("취소 처리 중 오류가 발생했습니다.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>입찰 내역</h2>

      <div className={styles.subTabs}>
        {(["buy", "sell", "concluded"] as BidTab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.subTab} ${tab === t ? styles.subTabActive : ""}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : tab === "buy" ? (
        <div className={styles.itemList}>
          {buyBids.filter((i) => i.status !== "MATCHED").length === 0 && (
            <p className={styles.empty}>구매 입찰 내역이 없습니다.</p>
          )}
          {buyBids
            .filter((i) => i.status !== "MATCHED")
            .map((item) => (
              <div
                key={item.id}
                className={styles.itemRow}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/product/${item.itemId}`)}
              >
                <ItemThumb imageUrl={item.itemImageUrl} name={item.itemName} />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.itemName}</div>
                  <div className={styles.itemMeta}>
                    {item.optionValue ? `사이즈: ${item.optionValue}` : ""}
                  </div>
                  <div className={styles.itemMeta}>{item.createdAt?.slice(0, 10)}</div>
                </div>
                <div className={styles.itemRight}>
                  <StatusBadge status={item.status} />
                  <div className={styles.itemPrice}>{item.price.toLocaleString()}원</div>
                  {item.status === "PENDING" && (
                    <button
                      className={styles.cancelBidBtn}
                      disabled={cancellingId === item.id}
                      onClick={(e) => handleCancelBuyBid(e, item.id)}
                    >
                      {cancellingId === item.id ? "취소 중..." : "입찰 취소"}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : tab === "sell" ? (
        <div className={styles.itemList}>
          {sellBids.filter((i) => i.status !== "MATCHED").length === 0 && (
            <p className={styles.empty}>판매 입찰 내역이 없습니다.</p>
          )}
          {sellBids
            .filter((i) => i.status !== "MATCHED")
            .map((item) => (
              <div
                key={item.id}
                className={styles.itemRow}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/product/${item.itemId}`)}
              >
                <ItemThumb imageUrl={item.itemImageUrl} name={item.itemName} />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.itemName}</div>
                  <div className={styles.itemMeta}>
                    {item.optionValue ? `사이즈: ${item.optionValue}` : ""}
                  </div>
                  <div className={styles.itemMeta}>{item.createdAt?.slice(0, 10)}</div>
                </div>
                <div className={styles.itemRight}>
                  <StatusBadge status={item.status} />
                  <div className={styles.itemPrice}>{item.price.toLocaleString()}원</div>
                  {item.status === "PENDING" && (
                    <button
                      className={styles.cancelBidBtn}
                      disabled={cancellingId === item.id}
                      onClick={(e) => handleCancelSellBid(e, item.id)}
                    >
                      {cancellingId === item.id ? "취소 중..." : "입찰 취소"}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className={styles.itemList}>
          {concludedBuy.length === 0 && concludedSell.length === 0 && (
            <p className={styles.empty}>체결된 거래 내역이 없습니다.</p>
          )}
          {concludedBuy.map((item) => (
            <div
              key={`buy-${item.id}`}
              className={styles.itemRow}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/product/${item.itemId}`)}
            >
              <ItemThumb imageUrl={item.itemImageUrl} name={item.itemName} />
              <div className={styles.itemInfo}>
                <div className={styles.itemMeta} style={{ fontSize: "0.75rem", color: "#888" }}>구매</div>
                <div className={styles.itemName}>{item.itemName}</div>
                <div className={styles.itemMeta}>
                  {item.optionValue ? `사이즈: ${item.optionValue}` : ""}
                </div>
                <div className={styles.itemMeta}>{item.createdAt?.slice(0, 10)}</div>
              </div>
              <div className={styles.itemRight}>
                <StatusBadge status="체결됨" />
                <div className={styles.itemPrice}>{item.tradePrice.toLocaleString()}원</div>
              </div>
            </div>
          ))}
          {concludedSell.map((item) => (
            <div
              key={`sell-${item.id}`}
              className={styles.itemRow}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/product/${item.itemId}`)}
            >
              <ItemThumb imageUrl={item.itemImageUrl} name={item.itemName} />
              <div className={styles.itemInfo}>
                <div className={styles.itemMeta} style={{ fontSize: "0.75rem", color: "#888" }}>판매</div>
                <div className={styles.itemName}>{item.itemName}</div>
                <div className={styles.itemMeta}>
                  {item.optionValue ? `사이즈: ${item.optionValue}` : ""}
                </div>
                <div className={styles.itemMeta}>{item.createdAt?.slice(0, 10)}</div>
              </div>
              <div className={styles.itemRight}>
                <StatusBadge status="체결됨" />
                <div className={styles.itemPrice}>{item.tradePrice.toLocaleString()}원</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
