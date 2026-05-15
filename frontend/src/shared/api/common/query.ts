/**
 * normalizeKeyword
 * - 문자열 검색어 공백 제거 후 빈값이면 undefined 반환
 */
export function normalizeKeyword(keyword?: string) {
    const value = keyword?.trim();
    return value ? value : undefined;
}

/**
 * normalizeOptionalValue
 * - 빈 문자열("")이면 undefined 반환
 */
export function normalizeOptionalValue<T>(value: T | "") {
    return value === "" ? undefined : value;
}

/**
 * normalizeParentId
 * - parentId가 null/undefined/0 이하이면 null 처리
 */
export function normalizeParentId(parentId?: number | null) {
    return parentId == null || parentId <= 0 ? null : parentId;
}