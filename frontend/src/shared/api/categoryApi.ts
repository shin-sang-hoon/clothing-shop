import { http } from "./http";

export type PublicCategoryItem = {
  id: number;
  name: string;
  code: string;
  depth: number;
  parentId: number | null;
  imageUrl: string | null;
  sortOrder: number;
  useYn?: boolean;
};

export async function apiGetCategories(): Promise<PublicCategoryItem[]> {
  const res = await http.get<PublicCategoryItem[]>("/categories");
  return res.data;
}

export type CategoryDisplayFilter = {
  id: number;
  name: string;
  code: string;
  colorHex: string | null;
};

export type CategoryDisplayFilterGroup = {
  filterGroupId: number;
  filterGroupName: string;
  filterGroupCode: string;
  filters: CategoryDisplayFilter[];
};

export type CategoryDisplayTag = {
  id: number;
  name: string;
  code: string;
};

export type CategoryDisplayMappingResponse = {
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  parentId: number | null;
  parentCode: string | null;
  filterGroups: CategoryDisplayFilterGroup[];
  tags: CategoryDisplayTag[];
};

export async function apiGetCategoryDisplayMapping(
  categoryCode: string,
): Promise<CategoryDisplayMappingResponse> {
  const res = await http.get<CategoryDisplayMappingResponse>(
    `/categories/${encodeURIComponent(categoryCode)}/display-mapping`,
  );
  return res.data;
}

export type FilterGroupRole = "ATTRIBUTE" | "OPTION" | "ALL";

export type FilterInGroupResponse = {
  id: number;
  name: string;
  code: string;
  colorHex?: string | null;
  iconImageUrl?: string | null;
};

export type CategoryFilterGroupResponse = {
  filterGroupId: number;
  filterGroupName: string;
  filterGroupCode: string;
  multiSelectYn: boolean;
  role: FilterGroupRole;
  filters: FilterInGroupResponse[];
};

export async function apiGetCategoryFilterGroups(
  categoryId: number,
): Promise<CategoryFilterGroupResponse[]> {
  const res = await http.get<CategoryFilterGroupResponse[]>(
    `/admin/categories/${categoryId}/filter-groups`,
  );
  return res.data;
}

// temporary aliases for existing components during transition
export type TagGroupRole = FilterGroupRole;
export type TagInGroupResponse = FilterInGroupResponse;
export type CategoryTagGroupResponse = CategoryFilterGroupResponse;
export const apiGetCategoryTagGroups = apiGetCategoryFilterGroups;
