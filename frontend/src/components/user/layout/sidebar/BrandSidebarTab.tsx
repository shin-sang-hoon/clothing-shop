import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FavoriteButton from "@/components/common/FavoriteButton";
import { apiGetBrands, type UserBrandRow } from "@/shared/api/brandApi";
import {
  apiGetMyLikedBrands,
  type LikedBrandResponse,
} from "@/shared/api/likeApi";
import { useBrandLikes } from "@/shared/hooks/useLikes";
import styles from "../UserSidebar.module.css";
import BrandLogo from "./BrandLogo";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type BrandSortOrder = "asc" | "desc";
type BrandApiSort = "default" | "nameAsc" | "nameDesc";
type FilterGroup = "korean" | "latin" | "number" | null;

type BrandCacheValue = {
  items: UserBrandRow[];
  page: number;
  hasNext: boolean;
  totalElements: number;
};

const BRAND_PAGE_SIZE = 100;
const BRAND_SEARCH_DEBOUNCE_MS = 250;
const ALL_BRAND_FILTER = "ALL";
const FAVORITE_BRAND_FILTER = "FAVORITE";
const SORT_BRAND_FILTER = "SORT";
const KOREAN_FILTER_GROUP = "KOREAN_GROUP";
const LATIN_FILTER_GROUP = "LATIN_GROUP";
const NUMBER_FILTER_GROUP = "NUMBER_GROUP";
const KOREAN_CONSONANTS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const LATIN_ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NUMBER_FILTERS = "0123456789".split("");

function mergeUniqueBrands(prev: UserBrandRow[], next: UserBrandRow[]): UserBrandRow[] {
  const seen = new Set<number>();
  const merged: UserBrandRow[] = [];

  [...prev, ...next].forEach((brand) => {
    if (seen.has(brand.id)) {
      return;
    }

    seen.add(brand.id);
    merged.push(brand);
  });

  return merged;
}

function mapLikedBrandToUserBrandRow(brand: LikedBrandResponse): UserBrandRow {
  return {
    id: brand.brandId,
    code: String(brand.brandId),
    nameKo: brand.nameKo,
    nameEn: brand.nameEn,
    iconImageUrl: brand.iconImageUrl,
    exclusiveYn: false,
    sortOrder: 0,
  };
}

export default function BrandSidebarTab({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { isLiked: isBrandLiked, like: likeBrand, unlike: unlikeBrand } = useBrandLikes();

  const [alphabetFilter, setAlphabetFilter] = useState<string>(ALL_BRAND_FILTER);
  const [brandSortOrder, setBrandSortOrder] = useState<BrandSortOrder>("asc");
  const [openFilterGroup, setOpenFilterGroup] = useState<FilterGroup>(null);
  const [brandKeyword, setBrandKeyword] = useState("");
  const [debouncedBrandKeyword, setDebouncedBrandKeyword] = useState("");
  const [brands, setBrands] = useState<UserBrandRow[]>([]);
  const [brandPage, setBrandPage] = useState(0);
  const [brandHasNext, setBrandHasNext] = useState(true);
  const [brandTotalElements, setBrandTotalElements] = useState(0);
  const [isBrandLoading, setIsBrandLoading] = useState(false);
  const [isBrandFetchingMore, setIsBrandFetchingMore] = useState(false);
  const [brandErrorMessage, setBrandErrorMessage] = useState("");
  const [favoriteBrands, setFavoriteBrands] = useState<UserBrandRow[]>([]);

  const brandCacheRef = useRef<Map<string, BrandCacheValue>>(new Map());
  const brandLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const latestBrandQueryKeyRef = useRef("");

  const isFavoriteFilter = alphabetFilter === FAVORITE_BRAND_FILTER;
  const displayBrands = isFavoriteFilter ? favoriteBrands : brands;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedBrandKeyword(brandKeyword);
    }, BRAND_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [brandKeyword]);

  const brandApiSort = useMemo<BrandApiSort>(() => {
    if (alphabetFilter === SORT_BRAND_FILTER) {
      return brandSortOrder === "asc" ? "nameAsc" : "nameDesc";
    }

    return "default";
  }, [alphabetFilter, brandSortOrder]);

  const brandInitialConsonant = useMemo<string | undefined>(() => {
    if (
      alphabetFilter === ALL_BRAND_FILTER ||
      alphabetFilter === FAVORITE_BRAND_FILTER ||
      alphabetFilter === SORT_BRAND_FILTER
    ) {
      return undefined;
    }

    return alphabetFilter;
  }, [alphabetFilter]);

  const brandQueryKey = useMemo(() => {
    return JSON.stringify({
      keyword: debouncedBrandKeyword.trim(),
      initialConsonant: brandInitialConsonant ?? "",
      sort: brandApiSort,
    });
  }, [brandApiSort, brandInitialConsonant, debouncedBrandKeyword]);

  const favoriteBrandQueryKey = useMemo(
    () => debouncedBrandKeyword.trim().toLowerCase(),
    [debouncedBrandKeyword],
  );

  function handleMoveBrandShop(brand: UserBrandRow) {
    const params = new URLSearchParams();
    params.set("brandCode", String(brand.id));
    navigate(`/shop?${params.toString()}`);
    onClose();
  }

  function handlePrimaryFilterClick(value: string) {
    if (value === FAVORITE_BRAND_FILTER) {
      setAlphabetFilter(FAVORITE_BRAND_FILTER);
      setOpenFilterGroup(null);
      return;
    }

    if (value === SORT_BRAND_FILTER) {
      setOpenFilterGroup(null);
      if (alphabetFilter === SORT_BRAND_FILTER) {
        setBrandSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setAlphabetFilter(SORT_BRAND_FILTER);
        setBrandSortOrder("asc");
      }
      return;
    }

    if (value === ALL_BRAND_FILTER) {
      setAlphabetFilter(ALL_BRAND_FILTER);
      setOpenFilterGroup(null);
      return;
    }

    if (value === KOREAN_FILTER_GROUP) {
      setOpenFilterGroup((prev) => {
        if (prev !== "korean") setAlphabetFilter(ALL_BRAND_FILTER);
        return prev === "korean" ? null : "korean";
      });
      return;
    }

    if (value === LATIN_FILTER_GROUP) {
      setOpenFilterGroup((prev) => {
        if (prev !== "latin") setAlphabetFilter(ALL_BRAND_FILTER);
        return prev === "latin" ? null : "latin";
      });
      return;
    }

    if (value === NUMBER_FILTER_GROUP) {
      setOpenFilterGroup((prev) => {
        if (prev !== "number") setAlphabetFilter(ALL_BRAND_FILTER);
        return prev === "number" ? null : "number";
      });
    }
  }

  function handleDetailFilterClick(value: string, group: FilterGroup) {
    setAlphabetFilter(value);
    setOpenFilterGroup(group);
  }

  function isFilterGroupActive(group: FilterGroup): boolean {
    if (group === "korean") {
      return KOREAN_CONSONANTS.includes(alphabetFilter);
    }
    if (group === "latin") {
      return LATIN_ALPHABETS.includes(alphabetFilter);
    }
    if (group === "number") {
      return NUMBER_FILTERS.includes(alphabetFilter);
    }
    return false;
  }

  async function loadFavoriteBrands(): Promise<void> {
    setIsBrandLoading(true);
    setBrandErrorMessage("");

    try {
      const response = await apiGetMyLikedBrands();
      const keyword = favoriteBrandQueryKey;

      const filtered = response
        .map(mapLikedBrandToUserBrandRow)
        .filter((brand) => {
          if (!keyword) {
            return true;
          }

          return (
            brand.nameKo.toLowerCase().includes(keyword) ||
            brand.nameEn.toLowerCase().includes(keyword)
          );
        });

      setFavoriteBrands(filtered);
      setBrandTotalElements(filtered.length);
      setBrandHasNext(false);
      setBrandPage(0);
    } catch (error) {
      console.error("좋아요 브랜드 목록 조회 실패:", error);
      setFavoriteBrands([]);
      setBrandTotalElements(0);
      setBrandHasNext(false);
      setBrandPage(0);
      setBrandErrorMessage("좋아요 브랜드 목록을 불러오지 못했습니다.");
    } finally {
      setIsBrandLoading(false);
      setIsBrandFetchingMore(false);
    }
  }

  const fetchBrandPage = async (pageToLoad: number, append: boolean): Promise<void> => {
    if (!isOpen) {
      return;
    }

    if (append) {
      if (isBrandLoading || isBrandFetchingMore || !brandHasNext) {
        return;
      }
      setIsBrandFetchingMore(true);
    } else {
      if (isBrandLoading) {
        return;
      }
      setIsBrandLoading(true);
      setBrandErrorMessage("");
    }

    const requestKey = brandQueryKey;
    latestBrandQueryKeyRef.current = requestKey;

    try {
      const response = await apiGetBrands({
        page: pageToLoad,
        size: BRAND_PAGE_SIZE,
        keyword: debouncedBrandKeyword,
        initialConsonant: brandInitialConsonant,
        sort: brandApiSort,
      });

      if (latestBrandQueryKeyRef.current !== requestKey) {
        return;
      }

      setBrands((prev) => {
        const nextItems = append ? mergeUniqueBrands(prev, response.content) : response.content;

        brandCacheRef.current.set(requestKey, {
          items: nextItems,
          page: response.page,
          hasNext: !response.last,
          totalElements: response.totalElements,
        });

        return nextItems;
      });

      setBrandPage(response.page);
      setBrandHasNext(!response.last);
      setBrandTotalElements(response.totalElements);
      setBrandErrorMessage("");
    } catch (error) {
      console.error("브랜드 목록 조회 실패:", error);

      if (!append) {
        setBrandErrorMessage("브랜드 목록을 불러오지 못했습니다.");
        setBrands([]);
        setBrandPage(0);
        setBrandHasNext(false);
        setBrandTotalElements(0);
      }
    } finally {
      setIsBrandLoading(false);
      setIsBrandFetchingMore(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isFavoriteFilter) {
      void loadFavoriteBrands();
      return;
    }

    const cached = brandCacheRef.current.get(brandQueryKey);
    latestBrandQueryKeyRef.current = brandQueryKey;

    if (cached) {
      setBrands(cached.items);
      setBrandPage(cached.page);
      setBrandHasNext(cached.hasNext);
      setBrandTotalElements(cached.totalElements);
      setBrandErrorMessage("");
      return;
    }

    setBrands([]);
    setBrandPage(0);
    setBrandHasNext(true);
    setBrandTotalElements(0);
    setBrandErrorMessage("");
    void fetchBrandPage(0, false);
  }, [brandQueryKey, favoriteBrandQueryKey, isFavoriteFilter, isOpen]);

  useEffect(() => {
    if (!isOpen || isFavoriteFilter) {
      return;
    }

    const sentinel = brandLoadMoreRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }
        if (isBrandLoading || isBrandFetchingMore || !brandHasNext) {
          return;
        }
        void fetchBrandPage(brandPage + 1, true);
      },
      {
        root: null,
        rootMargin: "160px",
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [brandHasNext, brandPage, isBrandFetchingMore, isBrandLoading, isFavoriteFilter, isOpen]);

  async function handleToggleBrandLike(brandId: number): Promise<void> {
    const wasLiked = isBrandLiked(brandId);
    if (wasLiked) {
      await unlikeBrand(brandId);
    } else {
      await likeBrand(brandId);
    }

    if (isFavoriteFilter && wasLiked) {
      setFavoriteBrands((prev) => prev.filter((brand) => brand.id !== brandId));
      setBrandTotalElements((prev) => Math.max(prev - 1, 0));
    }
  }

  function renderSecondaryFilters() {
    if (openFilterGroup === "korean") {
      return (
        <div className={styles.sidebarBrandConsonantRow}>
          {KOREAN_CONSONANTS.map((letter) => (
            <button
              key={letter}
              type="button"
              className={
                alphabetFilter === letter
                  ? styles.sidebarBrandConsonantBtnActive
                  : styles.sidebarBrandConsonantBtn
              }
              onClick={() => handleDetailFilterClick(letter, "korean")}
            >
              {letter}
            </button>
          ))}
        </div>
      );
    }

    if (openFilterGroup === "latin") {
      return (
        <div className={styles.sidebarBrandConsonantRow}>
          {LATIN_ALPHABETS.map((letter) => (
            <button
              key={letter}
              type="button"
              className={
                alphabetFilter === letter
                  ? styles.sidebarBrandConsonantBtnActive
                  : styles.sidebarBrandConsonantBtn
              }
              onClick={() => handleDetailFilterClick(letter, "latin")}
            >
              {letter}
            </button>
          ))}
        </div>
      );
    }

    if (openFilterGroup === "number") {
      return (
        <div className={styles.sidebarBrandConsonantRow}>
          {NUMBER_FILTERS.map((num) => (
            <button
              key={num}
              type="button"
              className={
                alphabetFilter === num
                  ? styles.sidebarBrandConsonantBtnActive
                  : styles.sidebarBrandConsonantBtn
              }
              onClick={() => handleDetailFilterClick(num, "number")}
            >
              {num}
            </button>
          ))}
        </div>
      );
    }

    return null;
  }

  const brandCountText = isFavoriteFilter
    ? `좋아요 브랜드 총 ${brandTotalElements}개`
    : alphabetFilter === SORT_BRAND_FILTER
      ? `전체 브랜드 총 ${brandTotalElements}개 (가나다순)`
      : alphabetFilter === ALL_BRAND_FILTER
        ? `전체 브랜드 총 ${brandTotalElements}개`
        : `'${alphabetFilter}' 브랜드 총 ${brandTotalElements}개`;

  const sortButtonLabel =
    alphabetFilter === SORT_BRAND_FILTER && brandSortOrder === "desc"
      ? "가나다 역순"
      : "가나다순";

  return (
    <div className={styles.sidebarBody}>
      <div className={styles.brandSearchWrap}>
        <div className={styles.brandSearchInner}>
          <input
            type="text"
            placeholder="브랜드를 검색하세요"
            value={brandKeyword}
            onChange={(e) => setBrandKeyword(e.target.value)}
          />
          <span>⌕</span>
        </div>
      </div>

      <div className={styles.sidebarBrandFilterWrap}>
        <div className={styles.sidebarBrandConsonantRow}>
          <button
            type="button"
            className={
              alphabetFilter === ALL_BRAND_FILTER && openFilterGroup === null
                ? styles.sidebarBrandConsonantBtnActive
                : styles.sidebarBrandConsonantBtn
            }
            onClick={() => handlePrimaryFilterClick(ALL_BRAND_FILTER)}
          >
            인기
          </button>
          <button
            type="button"
            className={
              alphabetFilter === FAVORITE_BRAND_FILTER
                ? styles.sidebarBrandConsonantBtnActive
                : styles.sidebarBrandConsonantBtn
            }
            onClick={() => handlePrimaryFilterClick(FAVORITE_BRAND_FILTER)}
            aria-label="좋아요 브랜드"
          >
            ♡
          </button>
          <button
            type="button"
            className={
              openFilterGroup === "korean" || isFilterGroupActive("korean")
                ? styles.sidebarBrandConsonantBtnActive
                : styles.sidebarBrandConsonantBtn
            }
            onClick={() => handlePrimaryFilterClick(KOREAN_FILTER_GROUP)}
          >
            ㄱ-ㅎ
          </button>
          <button
            type="button"
            className={
              openFilterGroup === "latin" || isFilterGroupActive("latin")
                ? styles.sidebarBrandConsonantBtnActive
                : styles.sidebarBrandConsonantBtn
            }
            onClick={() => handlePrimaryFilterClick(LATIN_FILTER_GROUP)}
          >
            A-Z
          </button>
          <button
            type="button"
            className={
              openFilterGroup === "number" || isFilterGroupActive("number")
                ? styles.sidebarBrandConsonantBtnActive
                : styles.sidebarBrandConsonantBtn
            }
            onClick={() => handlePrimaryFilterClick(NUMBER_FILTER_GROUP)}
          >
            #
          </button>
          <button
            type="button"
            className={
              alphabetFilter === SORT_BRAND_FILTER
                ? styles.sidebarBrandConsonantBtnActive
                : styles.sidebarBrandConsonantBtn
            }
            onClick={() => handlePrimaryFilterClick(SORT_BRAND_FILTER)}
          >
            {sortButtonLabel}
          </button>
        </div>

        {renderSecondaryFilters()}
      </div>

      <div className={styles.brandCount}>{brandCountText}</div>

      {brandErrorMessage && <div className={styles.brandError}>{brandErrorMessage}</div>}

      <div className={styles.brandList}>
        {isBrandLoading && displayBrands.length === 0 ? (
          <div className={styles.brandLoading}>브랜드 목록을 불러오는 중입니다.</div>
        ) : displayBrands.length === 0 ? (
          <div className={styles.brandEmpty}>조건에 맞는 브랜드가 없습니다.</div>
        ) : (
          displayBrands.map((brand) => (
            <div
              key={brand.id}
              className={styles.brandItem}
              role="button"
              tabIndex={0}
              onClick={() => handleMoveBrandShop(brand)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleMoveBrandShop(brand);
                }
              }}
            >
              <BrandLogo nameKo={brand.nameKo} iconImageUrl={brand.iconImageUrl} />

              <div className={styles.brandItemInfo}>
                <div className={styles.brandItemName}>
                  {brand.nameKo}
                  {brand.exclusiveYn && (
                    <span className={styles.brandExclusive}>단독</span>
                  )}
                </div>
                <div className={styles.brandItemNameEn}>{brand.nameEn}</div>
              </div>

              <FavoriteButton
                liked={isBrandLiked(brand.id)}
                onLike={() => handleToggleBrandLike(brand.id)}
                onUnlike={() => handleToggleBrandLike(brand.id)}
                className={styles.brandHeart}
                ariaLabel={`${brand.nameKo} 좋아요`}
                unlikeMessage={`${brand.nameKo} 브랜드 좋아요를 취소하시겠습니까?`}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              />
            </div>
          ))
        )}

        <div ref={brandLoadMoreRef} className={styles.brandLoadMoreSentinel} />

        {!isFavoriteFilter && isBrandFetchingMore && (
          <div className={styles.brandLoadingMore}>브랜드를 더 불러오는 중입니다.</div>
        )}
      </div>
    </div>
  );
}
