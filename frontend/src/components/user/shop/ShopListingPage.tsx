import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ShopListingMode } from "@/components/user/shop/useShopListing";
import { useShopListing } from "@/components/user/shop/useShopListing";
import { useItemLikes } from "@/shared/hooks/useLikes";
import FilterPopupOverlay from "@/components/user/shop/FilterPopupOverlay";
import AttrPopupOverlay from "@/components/user/shop/AttrPopupOverlay";
import BrandPopupOverlay from "@/components/user/shop/BrandPopupOverlay";
import ShopListingHeader from "@/components/user/shop/ShopListingHeader";
import ShopProductGrid from "@/components/user/shop/ShopProductGrid";
import { apiGetBrands, apiGetBrandById, type UserBrandRow } from "@/shared/api/brandApi";
import { resolveUrl } from "@/shared/config/env";
import { useBrandLikes } from "@/shared/hooks/useLikes";
import styles from "@/pages/ShopPage.module.css";

function BrandBannerLogo({ brand }: { brand: UserBrandRow }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = brand.iconImageUrl ? resolveUrl(brand.iconImageUrl) : null;

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={brand.nameKo}
        className={styles.brandBannerLogo}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={styles.brandBannerLogoPlaceholder}>
      {brand.nameKo.slice(0, 1)}
    </div>
  );
}

interface Props {
  mode: ShopListingMode;
}

export default function ShopListingPage({ mode }: Props) {
  const navigate = useNavigate();
  const likes = useItemLikes();
  const listing = useShopListing(mode);
  const brandLikes = useBrandLikes();
  const [selectedBrandInfo, setSelectedBrandInfo] = useState<UserBrandRow | null>(null);
  const [brandLikeCnt, setBrandLikeCnt] = useState<number | null>(null);

  const brandCode = listing.searchParams.get("brandCode") ?? "";

  useEffect(() => {
    const brandName = listing.brand;
    const code = brandCode;

    if (!brandName && !code) {
      setSelectedBrandInfo(null);
      setBrandLikeCnt(null);
      return;
    }

    if (code) {
      const numId = Number(code);
      if (!isNaN(numId)) {
        apiGetBrandById(numId)
          .then((b) => { setSelectedBrandInfo(b); setBrandLikeCnt(b.likeCnt ?? null); })
          .catch(() => { setSelectedBrandInfo(null); setBrandLikeCnt(null); });
        return;
      }
    }

    apiGetBrands({ page: 0, size: 1, keyword: brandName })
      .then((res) => {
        const b = res.content[0] ?? null;
        setSelectedBrandInfo(b);
        setBrandLikeCnt(b?.likeCnt ?? null);
      })
      .catch(() => { setSelectedBrandInfo(null); setBrandLikeCnt(null); });
  }, [listing.brand, brandCode]);

  return (
    <div className={styles.page}>
      {mode === "shop" && listing.keyword && (
        <div className={styles.keywordBanner}>
          <span className={styles.keywordLabel}>
            <strong>"{listing.keyword}"</strong> 검색 결과 {listing.products.length}개
          </span>
          <button type="button" className={styles.keywordClear} onClick={listing.clearKeyword}>
            검색 초기화
          </button>
        </div>
      )}

      <ShopListingHeader
        modeLabel={listing.modeLabel}
        parentCategories={listing.parentCategories}
        currentParent={listing.currentParent}
        currentCategory={listing.currentCategory}
        childCategories={listing.childCategories}
        onNavigateHome={() => navigate("/")}
        onNavigateMode={() => navigate(listing.modePath)}
        onSelectParent={listing.handleSelectParent}
        onSelectSub={listing.handleSelectSub}
        displayFilterGroups={listing.displayFilterGroups}
        displayTags={listing.displayTags}
        mappingLoading={listing.mappingLoading}
        selectedFilterIds={listing.selectedFilterIds}
        selectedTagIds={listing.selectedTagIds}
        onOpenAttrPopup={listing.openAttrPopup}
        onOpenTagPopup={listing.openTagPopup}
        onClearAllFilters={listing.clearAllFilters}
        brand={listing.brand}
        onOpenBrandPopup={() => listing.setOpenBrandPopup(true)}
        sortBy={listing.sortBy}
        sortOptions={listing.sortOptions}
        onSortByChange={(value) => listing.setSortBy(value as typeof listing.sortBy)}
        gridCols={listing.gridCols}
        onChangeGridCols={listing.setGridCols}
        activeChips={listing.activeChips}
        onRemoveChip={listing.removeActiveChip}
      />

      {selectedBrandInfo && (
        <div className={styles.brandBanner}>
          <BrandBannerLogo brand={selectedBrandInfo} />
          <div className={styles.brandBannerInfo}>
            <span className={styles.brandBannerName}>{selectedBrandInfo.nameKo}</span>
            {selectedBrandInfo.nameEn && (
              <span className={styles.brandBannerNameEn}>{selectedBrandInfo.nameEn}</span>
            )}
          </div>
          <div className={styles.brandBannerLikeWrap}>
            <button
              type="button"
              className={`${styles.brandBannerLikeBtn} ${brandLikes.isLiked(selectedBrandInfo.id) ? styles.brandBannerLikeBtnActive : ""}`}
              onClick={async (e) => {
                const wasLiked = brandLikes.isLiked(selectedBrandInfo.id);
                await brandLikes.toggleLike(e, selectedBrandInfo.id);
                setBrandLikeCnt((prev) => (prev ?? 0) + (wasLiked ? -1 : 1));
              }}
            >
              {brandLikes.isLiked(selectedBrandInfo.id) ? "♥" : "♡"}
            </button>
            {brandLikeCnt != null && (
              <span className={styles.brandBannerLikeCnt}>{brandLikeCnt.toLocaleString()}</span>
            )}
          </div>
        </div>
      )}

      <p className={styles.resultCount}>
        {listing.resultText} {listing.loading ? "..." : listing.serverTotal}개
      </p>

      <ShopProductGrid
        loading={listing.loading}
        items={listing.products}
        gridCols={listing.gridCols}
        hasMore={listing.hasMore}
        loadingMore={listing.loadingMore}
        loadedCount={listing.accumulatedItems.length}
        totalCount={listing.serverTotal}
        emptyMessage={listing.emptyMessage}
        onLoadMore={listing.loadMore}
        onClickItem={(itemId) => {
          if (mode === "rental" || mode === "auction") {
            navigate(`/product/${itemId}?mode=${mode}`);
          } else {
            navigate(`/product/${itemId}`);
          }
        }}
        onToggleLikeById={likes.toggleLikeById}
        isLikedById={likes.isLikedById}
        priceText={listing.priceText}
      />

      {listing.openPopup && (
        <FilterPopupOverlay
          group={{ name: listing.openPopup.title, options: listing.openPopup.options }}
          tempIds={listing.popupTempIds}
          onToggle={listing.togglePopupOption}
          onSelectAll={listing.selectAllPopupOptions}
          onConfirm={listing.confirmPopup}
          onClose={() => {
            listing.setOpenPopup(null);
            listing.setPopupTempIds([]);
          }}
          productCount={listing.popupPreviewCount}
        />
      )}

      {listing.attrPopupOpen && (
        <AttrPopupOverlay
          groups={listing.displayFilterGroups}
          tempIds={listing.popupTempIds}
          onToggle={listing.togglePopupOption}
          onConfirm={listing.confirmAttrPopup}
          onClose={() => { listing.setAttrPopupOpen(false); listing.setPopupTempIds([]); }}
          productCount={listing.products.length}
        />
      )}

      {listing.openBrandPopup && (
        <BrandPopupOverlay
          selectedBrand={listing.brand}
          onSelect={listing.handleBrandSelect}
          onClose={() => listing.setOpenBrandPopup(false)}
        />
      )}
    </div>
  );
}
