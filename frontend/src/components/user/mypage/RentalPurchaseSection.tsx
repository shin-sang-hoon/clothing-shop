import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveUrl } from "@/shared/config/env";
import { apiGetMyRenting, type RentalOrderResponse } from "@/shared/api/rentalApi";
import styles from "@/pages/MyPage.module.css";
import StatusBadge from "./StatusBadge";

export default function RentalPurchaseSection() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<RentalOrderResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetMyRenting()
      .then(setRentals)
      .catch(() => setRentals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className={styles.sectionTitle}>렌탈 내역</h2>

      {loading ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : (
        <div className={styles.itemList}>
          {rentals.length === 0 && <p className={styles.empty}>렌탈 내역이 없습니다.</p>}
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
                ) : null}
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemBrand}>{item.brandName}</div>
                <div className={styles.itemName}>{item.itemName}</div>
                <div className={styles.itemMeta}>
                  {item.startDate} ~ {item.endDate}
                  {item.startDate && item.endDate && (() => {
                    const days = Math.round(
                      (new Date(item.endDate!).getTime() - new Date(item.startDate!).getTime()) / 86400000
                    ) + 1;
                    return <span style={{ marginLeft: 6, color: "#6b7280" }}>({days}일)</span>;
                  })()}
                </div>
                <div className={styles.itemMeta} style={{ marginTop: 4 }}>
                  주문번호:{" "}
                  <span
                    style={{ color: "#2563eb", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/delivery?orderNo=${item.orderNo}`); }}
                  >
                    {item.orderNo}
                  </span>
                </div>
              </div>
              <div className={styles.itemRight}>
                <StatusBadge status={item.status} />
                <div className={styles.itemPrice}>
                  {item.paidAmount != null
                    ? `${item.paidAmount.toLocaleString()}원`
                    : item.rentalPrice != null
                      ? `${item.rentalPrice.toLocaleString()}원`
                      : "가격 미정"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
