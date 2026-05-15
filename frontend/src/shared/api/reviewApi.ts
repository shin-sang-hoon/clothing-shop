import { http } from "./http";

export interface ReviewResponse {
  id: number;
  memberId: number;
  memberName: string;
  rating: number;
  content: string;
  size: string | null;
  height: number | null;
  weight: number | null;
  photoUrl: string | null;
  createdAt: string | null;
}

export interface ReviewPageResponse {
  content: ReviewResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export async function apiGetItemReviews(
  itemId: number,
  page = 0,
  size = 10,
): Promise<ReviewPageResponse> {
  const res = await http.get<ReviewPageResponse>(
    `/items/${itemId}/reviews`,
    { params: { page, size } },
  );
  return res.data;
}

export async function apiDeleteReview(reviewId: number): Promise<void> {
  await http.delete(`/reviews/${reviewId}`);
}

export interface ReviewReportResponse {
  id: number;
  reviewId: number;
  reporterId: number;
  reporterName: string;
  reviewContent: string;
  reviewAuthor: string;
  reason: string;
  status: string;
  handledNote: string | null;
  createdAt: string | null;
}

export async function apiReportReview(reviewId: number, reason: string): Promise<ReviewReportResponse> {
  const res = await http.post<ReviewReportResponse>(`/reviews/${reviewId}/report`, { reason });
  return res.data;
}

export async function apiGetAdminReviewReports(): Promise<ReviewReportResponse[]> {
  const res = await http.get<ReviewReportResponse[]>("/admin/review-reports");
  return res.data;
}

export async function apiHandleReviewReport(
  reportId: number,
  action: "RESOLVE" | "DISMISS",
  note?: string,
): Promise<ReviewReportResponse> {
  const res = await http.put<ReviewReportResponse>(`/admin/review-reports/${reportId}/handle`, { action, note });
  return res.data;
}

export async function apiSubmitReview(
  itemId: number,
  rating: number,
  content: string,
  photo: File | null,
  size?: string,
  height?: number,
  weight?: number,
): Promise<ReviewResponse> {
  const form = new FormData();
  form.append("itemId", String(itemId));
  form.append("rating", String(rating));
  form.append("content", content);
  if (size) form.append("size", size);
  if (height != null) form.append("height", String(height));
  if (weight != null) form.append("weight", String(weight));
  if (photo) form.append("photo", photo);

  const res = await http.post<ReviewResponse>("/reviews", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
