import FavoriteButton from "@/components/common/FavoriteButton";
import type { ShopItemResponse } from "@/shared/api/itemApi";
import { resolveUrl } from "@/shared/config/env";
import { dummyLikeBase } from "@/shared/utils/dummyLike";
import styles from "./MainItemCard.module.css";

interface MainItemCardProps {
  product: ShopItemResponse;
  liked: boolean;
  onLike: () => void | Promise<void>;
  onUnlike: () => void | Promise<void>;
  onOpen: () => void;
  rank?: number;
  className?: string;
  mode?: "rental" | "auction";
}

export default function MainItemCard({
  product,
  liked,
  onLike,
  onUnlike,
  onOpen,
  rank,
  className,
  mode,
}: MainItemCardProps) {
  const imageUrl = resolveUrl(product.img);

  return (
    <article
      className={`${styles.card}${className ? ` ${className}` : ""}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className={styles.imageWrap}>
        {rank ? <span className={styles.rank}>{rank}</span> : null}
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className={styles.image} />
        ) : (
          <span className={styles.empty}>No Image</span>
        )}

        <FavoriteButton
          liked={liked}
          onLike={onLike}
          onUnlike={onUnlike}
          className={styles.heartBtn}
          ariaLabel={`${product.name} 좋아요`}
          unlikeMessage={`${product.name} 좋아요를 취소하시겠습니까?`}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.brand}>{product.brand}</div>
        <div className={styles.name}>{product.name}</div>
        <div className={styles.price}>
          {mode === "rental"
            ? `${(product.rentalPrice ?? 0).toLocaleString()}원/일`
            : `${(product.retailPrice ?? 0).toLocaleString()}원`}
        </div>
        <div className={styles.likes}><span className={styles.likeHeart}>♥</span>{(dummyLikeBase(product.id) + (product.likeCnt ?? 0)).toLocaleString()}</div>
      </div>
    </article>
  );
}
