import type { AdminCategoryRow } from "@/shared/api/admin/categoryApi";

/**
 * getParentDepth
 * - 부모 id 기준 부모 depth 조회
 */
export function getParentDepth(categories: AdminCategoryRow[], parentId: number): number {
    if (parentId <= 0) return 0;
    const parent = categories.find((c) => c.id === parentId);
    return parent?.depth ?? 0;
}

/**
 * buildParentChain
 * - 현재 진입한 부모 카테고리까지의 breadcrumb 체인 생성
 */
export function buildParentChain(
    categories: AdminCategoryRow[],
    currentParentId: number,
): AdminCategoryRow[] {
    if (currentParentId <= 0) return [];

    const map = new Map<number, AdminCategoryRow>();
    categories.forEach((c) => map.set(c.id, c));

    const chain: AdminCategoryRow[] = [];
    const visited = new Set<number>();
    let cursorId: number | null = currentParentId;

    while (cursorId && cursorId > 0) {
        if (visited.has(cursorId)) break;
        visited.add(cursorId);
        const category = map.get(cursorId);
        if (!category) break;
        chain.unshift(category);
        cursorId = category.parentId ?? 0;
    }

    return chain;
}

/**
 * collectDescendantIds
 * - 특정 카테고리의 하위 전체 자손 id 수집
 */
export function collectDescendantIds(
    categories: AdminCategoryRow[],
    parentId: number,
): number[] {
    const result: number[] = [];
    const stack: number[] = [parentId];

    while (stack.length > 0) {
        const currentId = stack.pop() ?? 0;
        const children = categories.filter((c) => (c.parentId ?? 0) === currentId);
        children.forEach((child) => {
            result.push(child.id);
            stack.push(child.id);
        });
    }

    return result;
}

/**
 * sortCategories
 * - 형제 카테고리 정렬 (sortOrder → id)
 */
export function sortCategories(categories: AdminCategoryRow[]): AdminCategoryRow[] {
    return [...categories].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.id - b.id;
    });
}
