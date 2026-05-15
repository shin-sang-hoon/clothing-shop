import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveUrl } from "@/shared/config/env";
import {
  apiGetMySellBids,
  apiGetMyConcludedSellTrades,
  type SellBidResponse,
  type ConcludedTradeResponse,
} from "@/shared/api/tradeApi";
import { apiGetMyLending, type RentalOrderResponse } from "@/shared/api/rentalApi";
import styles from "@/pages/MyPage.module.css";
import StatusBadge from "./StatusBadge";

type SaleTab = "pending" | "concluded" | "rental";

const TAB_LABELS: Record<SaleTab, string> = {
  pending: "입찰중",
  concluded: "체결됨",
  rental: "렌탈",
};

export default function SaleSection() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SaleTab>("pending");
  const [pending, setPending] = useState<SellBidResponse[]>([]);
  const [concluded, setConcluded] = useState<ConcludedTradeResponse[]>([]);
  const [rentals, setRentals] = useState<RentalOrderResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (tab === "pending") {
      apiGetMySellBids(0, 50)
        .then((r) => setPending(r.content))
        .catch(() => setPending([]))
        .finally(() => setLoading(false));
    } else if (tab === "concluded") {
      apiGetMyConcludedSellTrades(0, 50)
        .then((r) => setConcluded(r.content))
        .catch(() => setConcluded([]))
        .finally(() => setLoading(false));
    } else {
      apiGetMyLending()
        .then(setRentals)
        .catch(() => setRentals([]))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <div>
      <h2 className={styles.sectionTitle}>판매 내역</h2>

      <div className={styles.subTabs}>
        {(["pending", "concluded", "rental"] as SaleTab[]).map((t) => (
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
      ) : tab === "pending" ? (
        <div className={styles.itemList}>
          {pending.filter((item) => item.status !== "MATCHED").length === 0 && <p className={styles.empty}>판매 입찰 내역이 없습니다.</p>}
          {pending.filter((item) => item.status !== "MATCHED").map((item) => (
            <div
              key={item.id}
              className={styles.itemRow}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/product/${item.itemId}`)}
            >
              <div className={styles.itemThumb}>
                {item.itemImageUrl ? (
                  <img
                    src={resolveUrl(item.itemImageUrl)}
                    alt={item.itemName}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : null}
              </div>
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
              </div>
            </div>
          ))}
        </div>
      ) : tab === "concluded" ? (
        <div className={styles.itemList}>
          {concluded.length === 0 && <p className={styles.empty}>체결된 판매 내역이 없습니다.</p>}
          {concluded.map((item) => (
            <div
              key={item.id}
              className={styles.itemRow}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/product/${item.itemId}`)}
            >
              <div className={styles.itemThumb}>
                {item.itemImageUrl ? (
                  <img
                    src={resolveUrl(item.itemImageUrl)}
                    alt={item.itemName}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : null}
              </div>
              <div className={styles.itemInfo}>
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
      ) : (
        <div className={styles.itemList}>
          {rentals.length === 0 && <p className={styles.empty}>렌탈 판매 내역이 없습니다.</p>}
          {rentals.map((item) => (
            <div
              key={item.rentalId}
              className={styles.itemRow}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/product/${item.itemId}`)}
            >
              <div className={styles.itemThumb}>
                {item.itemImageUrl ? (
                  <img
                    src={resolveUrl(item.itemImageUrl)}
                    alt={item.itemName}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  "📦"
                )}
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemBrand}>{item.brandName}</div>
                <div className={styles.itemName}>{item.itemName}</div>
                <div className={styles.itemMeta}>{item.createdAt?.slice(0, 10)}</div>
              </div>
              <div className={styles.itemRight}>
                <StatusBadge status={item.status} />
                <div className={styles.itemPrice}>
                  {item.rentalPrice != null ? `${item.rentalPrice.toLocaleString()}원` : "가격 미정"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
