import { http } from "@/shared/api/http";

export type SearchTrend = "up" | "down" | "none";

export interface TrendingKeyword {
  rank: number;
  term: string;
  trend: SearchTrend;
  rankChange?: number;
}

export interface RisingKeyword {
  rank: number;
  term: string;
}

export interface SearchRankingsResponse {
  popular: TrendingKeyword[];
  rising: RisingKeyword[];
  updatedAt: string | null;
  cacheSource?: string;
}

export async function apiGetSearchRankings(): Promise<SearchRankingsResponse> {
  const res = await http.get<SearchRankingsResponse>("/public/search/rankings");
  console.log("[SEARCH RANKINGS]", "cacheSource=", res.data.cacheSource ?? "UNKNOWN");
  return res.data;
}
