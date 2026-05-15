import { resolveUrl } from "@/shared/config/env";

export function resolveBrandIconUrl(iconImageUrl?: string | null): string {
  return resolveUrl(iconImageUrl);
}
