/**
 * 아이템 ID로 결정론적 더미 관심수 기본값 생성
 * - 같은 ID는 항상 같은 값 반환 (새로고침해도 변하지 않음)
 * - 실제 likeCnt와 합산하여 표시: dummyLikeBase(id) + item.likeCnt
 */
export function dummyLikeBase(id: number): number {
  const h = Math.imul(id ^ (id >>> 16), 0x45d9f3b);
  return (((h ^ (h >>> 16)) >>> 0) % 491) + 12; // 12 ~ 502 범위
}
