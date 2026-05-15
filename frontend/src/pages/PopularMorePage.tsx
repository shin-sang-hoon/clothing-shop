import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FavoriteButton from "@/components/common/FavoriteButton";
import { apiGetHomePopularItems, type ShopItemResponse } from "@/shared/api/itemApi";
import { resolveUrl } from "@/shared/config/env";
import { dummyLikeBase } from "@/shared/utils/dummyLike";
import styles from "@/components/user/main/MorePage.module.css";
import { useItemLikes } from "@/shared/hooks/useLikes";

const SORT_OPTIONS = ["인기순", "최신순", "가격낮은순", "가격높은순"];

export default function PopularMorePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ShopItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("인기순");
  const { isLikedById, likeById, unlikeById } = useItemLikes();

  useEffect(() => {
    apiGetHomePopularItems({ size: 200 })
      .then((rows) => setItems(rows))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...items].sort((a, b) => {
    if (sortBy === "인기순") return (b.likeCnt ?? 0) - (a.likeCnt ?? 0);
    if (sortBy === "최신순") return b.id - a.id;
    if (sortBy === "가격낮은순") return (a.retailPrice ?? 0) - (b.retailPrice ?? 0);
    return (b.retailPrice ?? 0) - (a.retailPrice ?? 0);
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleWrap}>
          <span className={styles.liveDot} />
          <h1 className={styles.pageTitle}>실시간 인기</h1>
        </div>
        <p className={styles.pageDesc}>지금 가장 인기 있는 상품을 확인해보세요.</p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.categoryTabs} />
        <select className={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.resultCount}>총 {sorted.length}개</p>

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px", color: "#888" }}>불러오는 중...</p>
      ) : (
        <div className={styles.grid}>
          {sorted.map((product, index) => (
            <div
              key={product.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/product/${product.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(`/product/${product.id}`);
              }}
            >
              <div className={styles.cardImgWrap}>
                <span className={styles.rankBadge}>{index + 1}</span>
                {product.img ? (
                  <img
                    src={resolveUrl(product.img)}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span className={styles.cardImg}>이미지 없음</span>
                )}
                <FavoriteButton
                  liked={isLikedById(product.id)}
                  onLike={() => likeById(product.id)}
                  onUnlike={() => unlikeById(product.id)}
                  className={styles.heartBtn}
                  ariaLabel={`${product.name} 좋아요`}
                  unlikeMessage={`${product.name} 좋아요를 취소하시겠습니까?`}
                />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardBrand}>{product.brand}</div>
                <div className={styles.cardName}>{product.name}</div>
                <div className={styles.cardPriceRow}>
                  <span className={styles.cardPrice}>{(product.retailPrice ?? 0).toLocaleString()}원</span>
                </div>
                <div className={styles.cardLikes}>관심 {dummyLikeBase(product.id) + (product.likeCnt ?? 0)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
