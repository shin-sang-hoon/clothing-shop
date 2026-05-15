import { useNavigate } from "react-router-dom";
import type { ShopItemResponse } from "@/shared/api/itemApi";
import { useItemLikes } from "@/shared/hooks/useLikes";
import MainItemCard from "./MainItemCard";
import styles from "./RecommendSection.module.css";

interface RecommendSectionProps {
  products: ShopItemResponse[];
}

export default function RecommendSection({ products }: RecommendSectionProps) {
  const navigate = useNavigate();
  const { isLikedById, likeById, unlikeById } = useItemLikes();

  if (products.length === 0) return null;

  return (
    <section className={styles.recommendSection}>
      <div className={styles.recommendInner}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>추천 아이템</span>
        <span
          className={styles.sectionMore}
          role="button"
          tabIndex={0}
          onClick={() => navigate("/recommend")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate("/recommend");
            }
          }}
        >
          더보기 &gt;
        </span>
      </div>

      <div className={styles.productGrid}>
        {products.map((product) => (
          <MainItemCard
            key={product.id}
            product={product}
            liked={isLikedById(product.id)}
            onLike={() => likeById(product.id)}
            onUnlike={() => unlikeById(product.id)}
            onOpen={() => navigate(`/product/${product.id}`)}
          />
        ))}
      </div>
      </div>
    </section>
  );
}
