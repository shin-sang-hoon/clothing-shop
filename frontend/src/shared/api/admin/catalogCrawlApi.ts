import { http } from "@/shared/api/http";

/**
 * CrawlCategoryItem
 * - 카테고리 크롤링 응답 1건
 */
export interface CrawlCategoryItem {
    depth: number | null;
    name: string | null;
    code: string | null;
    parentCode: string | null;
    parentName: string | null;
    sortOrder?: number | null;
    imageUrl?: string | null;
    description?: string | null;
}

/**
 * CrawlBrandItem
 * - 브랜드 미리보기 응답 1건
 */
export interface CrawlBrandItem {
    rawId: string | null;
    code: string | null;
    nameKr: string | null;
    nameEn: string | null;
    displayOrder: number | null;
    exclusiveYn: boolean | null;
    logoImageUrl: string | null;
    categoryText: string | null;
}

/**
 * CrawlPreviewResponse
 * - 미리보기 응답
 */
export interface CrawlPreviewResponse {
    source: string;
    categoryCount: number;
    brandCount: number;
    itemCount?: number;
    tagGroupCount?: number;
    tagCount?: number;
    categories: CrawlCategoryItem[];
    brands: CrawlBrandItem[];
    tags?: Record<string, unknown>;
}

/**
 * CategoryImportResponse
 * - 카테고리 import 결과 응답
 */
export interface CategoryImportResponse {
    source: string;
    totalCount: number;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
}

/**
 * BrandImportResponse
 * - 브랜드 import 결과 응답
 */
export interface BrandImportResponse {
    source: string;
    totalCount: number;
    importedCount: number;
    skippedCount: number;
}

export interface CrawlJobStartResponse {
    jobId: string;
    jobType: string;
    status: "RUNNING" | "SUCCESS" | "FAILED" | string;
    message: string;
}

export interface CrawlJobStatusResponse<T = unknown> {
    jobId: string;
    jobType: string;
    status: "RUNNING" | "SUCCESS" | "FAILED" | string;
    message: string;
    startedAt: string | null;
    finishedAt: string | null;
    result: T | null;
}

export interface FilterImportResponse {
    source: string;
    crawledCategoryCount: number;
    failedCategoryCount: number;
    totalGroupCount: number;
    importedGroupCount: number;
    skippedGroupCount: number;
    totalTagCount: number;
    importedTagCount: number;
    skippedTagCount: number;
}

export type TagImportResponse = FilterImportResponse;

export interface ItemImportResponse {
    source: string;
    categoryCode: string;
    listedCount: number;
    importedCount: number;
    skippedCount: number;
    failedCount: number;
}

/**
 * apiImportCategories
 * - 카테고리 가져오기 실행
 */
export async function apiImportCategories(): Promise<CategoryImportResponse> {
    const response = await http.post<CategoryImportResponse>(
        "/admin/catalog/crawl/categories/import",
        null,
        { timeout: 300_000 },
    );

    return response.data;
}

/**
 * apiImportBrands
 * - 브랜드 가져오기 실행
 */
export async function apiImportBrands(): Promise<CrawlJobStartResponse> {
    const response = await http.post<CrawlJobStartResponse>(
        "/admin/catalog/crawl/brands/import",
        null,
        { timeout: 300_000 },
    );

    return response.data;
}

/**
 * apiPreviewBrands
 * - 브랜드 미리보기
 */
export async function apiPreviewBrands(): Promise<CrawlPreviewResponse> {
    const response = await http.post<CrawlPreviewResponse>(
        "/admin/catalog/crawl/brands/preview",
    );

    return response.data;
}

/**
 * apiPreviewCategories
 * - 카테고리 미리보기
 */
export async function apiPreviewCategories(): Promise<CrawlPreviewResponse> {
    const response = await http.post<CrawlPreviewResponse>(
        "/admin/catalog/crawl/categories/preview",
    );

    return response.data;
}

export async function apiImportFiltersByCategory(
    categoryCode: string,
): Promise<FilterImportResponse> {
    const response = await http.post<FilterImportResponse>(
        `/admin/catalog/crawl/filters/import?categoryCode=${encodeURIComponent(categoryCode)}`,
        null,
        { timeout: 300_000 },
    );

    return response.data;
}

export const apiImportTagsByCategory = apiImportFiltersByCategory;

export async function apiImportItemsByCategory(
    categoryCode: string,
): Promise<CrawlJobStartResponse> {
    const response = await http.post<CrawlJobStartResponse>(
        `/admin/catalog/crawl/items/import?categoryCode=${encodeURIComponent(categoryCode)}`,
        null,
        { timeout: 300_000 }, // 크롤링은 수분 소요 → 5분으로 설정
    );

    return response.data;
}

export async function apiGetCatalogCrawlJobStatus<T = unknown>(
    jobId: string,
): Promise<CrawlJobStatusResponse<T>> {
    const response = await http.get<CrawlJobStatusResponse<T>>(
        `/admin/catalog/crawl/jobs/${encodeURIComponent(jobId)}`,
    );

    return response.data;
}
