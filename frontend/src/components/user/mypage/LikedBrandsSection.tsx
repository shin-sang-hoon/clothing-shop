import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetMyLikedBrands,
  apiLikeBrand,
  apiUnlikeBrand,
  type LikedBrandResponse,
} from "@/shared/api/likeApi";
import styles from "@/pages/MyPage.module.css";
import { resolveBrandIconUrl } from "./brand";

export default function LikedBrandsSection() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<LikedBrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  // 좋아요 취소된 브랜드 ID set (빈 하트로 표시)
  const [unlikedIds, setUnlikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    apiGetMyLikedBrands()
      .then(setBrands)
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggleLike(e: React.MouseEvent, brandId: number) {
    e.stopPropagation();
    const isUnliked = unlikedIds.has(brandId);
    if (isUnliked) {
      // 빈 하트 → 다시 좋아요 (채워진 하트)
      try {
        await apiLikeBrand(brandId);
        setUnlikedIds((prev) => {
          const next = new Set(prev);
          next.delete(brandId);
          return next;
        });
      } catch {}
    } else {
      // 채워진 하트 → 좋아요 취소 (빈 하트)
      try {
        await apiUnlikeBrand(brandId);
        setUnlikedIds((prev) => new Set(prev).add(brandId));
      } catch {}
    }
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>관심 브랜드</h2>
      {loading ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : (
        <div className={styles.itemList}>
          {brands.length === 0 && <p className={styles.empty}>관심 브랜드가 없습니다.</p>}
          {brands.map((brand) => {
            const isUnliked = unlikedIds.has(brand.brandId);
            return (
              <div
                key={brand.brandId}
                className={styles.itemRow}
                onClick={() => navigate(`/shop?brandCode=${encodeURIComponent(String(brand.brandId))}`)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.itemThumb}>
                  {brand.iconImageUrl ? (
                    <img
                      src={resolveBrandIconUrl(brand.iconImageUrl)}
                      alt={brand.nameKo}
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
                    />
                  ) : (
                    "🏷️"
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{brand.nameKo}</div>
                  <div className={styles.itemMeta}>{brand.nameEn}</div>
                </div>
                <div className={styles.itemRight} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.itemHeartBtn}
                    onClick={(e) => handleToggleLike(e, brand.brandId)}
                    aria-label={isUnliked ? "좋아요 추가" : "좋아요 취소"}
                    style={{ color: isUnliked ? "#d1d5db" : "#ef4444" }}
                  >
                    {isUnliked ? "♡" : "♥"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
