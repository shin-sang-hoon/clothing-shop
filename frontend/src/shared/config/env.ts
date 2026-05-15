const BACKEND_ORIGIN_FALLBACK = "http://localhost:8080";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const BACKEND_ORIGIN = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_ORIGIN || BACKEND_ORIGIN_FALLBACK,
);

/**
 * resolveUrl
 * - 백엔드에서 받은 이미지 경로를 브라우저에서 접근 가능한 URL로 변환한다.
 * - /uploads/... 같은 상대 경로는 Vite proxy를 통해 접근하므로 그대로 사용한다.
 * - 이미 http(s):// 또는 data: 로 시작하면 그대로 반환한다.
 */
export function resolveUrl(path: string | null | undefined): string {
  if (!path) return "";
  const t = path.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t) || t.startsWith("data:")) return t;
  // 상대 경로 → 선행 슬래시 보정 후 반환 (Vite proxy가 처리)
  return t.startsWith("/") ? t : `/${t.replace(/\\/g, "/")}`;
}
