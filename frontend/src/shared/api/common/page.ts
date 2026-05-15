/**
 * PageResponse
 * - 공통 페이징 응답
 */
export type PageResponse<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
};

/**
 * SimpleListResponse
 * - 단순 목록 응답
 */
export type SimpleListResponse<T> = {
    content: T[];
    totalElements: number;
};