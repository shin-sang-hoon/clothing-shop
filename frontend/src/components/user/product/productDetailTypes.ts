import type { TradeEntry } from "@/shared/data/mockData";

export type TradeTab = "concluded" | "sellBids" | "buyBids";
export type DrawerRange = "1개월" | "3개월" | "6개월" | "1년" | "전체";
export const DRAWER_RANGES: DrawerRange[] = ["1개월", "3개월", "6개월", "1년", "전체"];
export const RANGE_COUNT: Record<DrawerRange, number> = {
    "1개월": 28,
    "3개월": 21,
    "6개월": 16,
    "1년": 10,
    "전체": 28,
};
export type { TradeEntry };
