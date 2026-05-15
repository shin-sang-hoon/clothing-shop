import type { MenuKey } from "./types";

export const SHOPPING_MENU: { key: MenuKey; label: string }[] = [
  { key: "bid", label: "입찰 내역" },
  { key: "rental-history", label: "렌탈 내역" },
  { key: "liked-brands", label: "관심 브랜드" },
  { key: "liked-items", label: "좋아요 상품" },
];

export const MY_INFO_MENU: { key: MenuKey; label: string }[] = [
  { key: "my-info", label: "내 정보" },
  { key: "social-accounts", label: "소셜 로그인 연동" },
];

export const DEFAULT_DISPLAY_NAME = "사용자";
export const DEFAULT_EMAIL = "user@example.com";
