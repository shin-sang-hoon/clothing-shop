import { useCallback, useEffect, useState } from "react";
import {
  apiGetMyLikedBrands,
  apiGetMyLikedItems,
  apiLikeBrand,
  apiLikeItem,
  apiUnlikeBrand,
  apiUnlikeItem,
} from "@/shared/api/likeApi";
import { useAuthStore } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";

function ensureLoggedInForLikeAction(): boolean {
  const { accessToken, me } = useAuthStore.getState();
  const isLoggedIn = Boolean(accessToken && me);
  if (isLoggedIn) {
    return true;
  }

  useModalStore
    .getState()
    .openAlert("warning", "로그인 필요", "좋아요는 로그인 상태에서만 사용할 수 있습니다.");
  return false;
}

export function useItemLikes() {
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);
  const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken && state.me));

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!isLoggedIn) {
      setLikedIds(new Set());
      return;
    }

    apiGetMyLikedItems()
      .then((items) => setLikedIds(new Set(items.map((item) => item.itemId))))
      .catch(() => {});
  }, [isAuthInitialized, isLoggedIn]);

  const isLikedById = useCallback((id: number) => likedIds.has(id), [likedIds]);

  const likeById = useCallback(
    async (id: number) => {
      if (!ensureLoggedInForLikeAction()) {
        return;
      }

      if (likedIds.has(id)) return;
      try {
        await apiLikeItem(id);
        setLikedIds((prev) => new Set([...prev, id]));
      } catch {}
    },
    [likedIds],
  );

  const unlikeById = useCallback(
    async (id: number) => {
      if (!ensureLoggedInForLikeAction()) {
        return;
      }

      if (!likedIds.has(id)) return;
      try {
        await apiUnlikeItem(id);
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch {}
    },
    [likedIds],
  );

  const toggleLikeById = useCallback(
    async (event: React.MouseEvent, id: number) => {
      event.stopPropagation();
      if (likedIds.has(id)) {
        await unlikeById(id);
        return;
      }
      await likeById(id);
    },
    [likedIds, likeById, unlikeById],
  );

  return { isLikedById, likeById, unlikeById, toggleLikeById };
}

export function useBrandLikes() {
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);
  const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken && state.me));

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!isLoggedIn) {
      setLikedIds(new Set());
      return;
    }

    apiGetMyLikedBrands()
      .then((brands) => setLikedIds(new Set(brands.map((brand) => brand.brandId))))
      .catch(() => {});
  }, [isAuthInitialized, isLoggedIn]);

  const isLiked = useCallback((brandId: number) => likedIds.has(brandId), [likedIds]);

  const like = useCallback(
    async (brandId: number) => {
      if (!ensureLoggedInForLikeAction()) {
        return;
      }

      if (likedIds.has(brandId)) {
        return;
      }

      try {
        await apiLikeBrand(brandId);
        setLikedIds((prev) => new Set([...prev, brandId]));
      } catch {}
    },
    [likedIds],
  );

  const unlike = useCallback(
    async (brandId: number) => {
      if (!ensureLoggedInForLikeAction()) {
        return;
      }

      if (!likedIds.has(brandId)) {
        return;
      }

      try {
        await apiUnlikeBrand(brandId);
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.delete(brandId);
          return next;
        });
      } catch {}
    },
    [likedIds],
  );

  const toggleLike = useCallback(
    async (event: React.MouseEvent, brandId: number) => {
      event.stopPropagation();

      if (isLiked(brandId)) {
        await unlike(brandId);
        return;
      }

      await like(brandId);
    },
    [isLiked, like, unlike],
  );

  return { isLiked, like, unlike, toggleLike };
}
