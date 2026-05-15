import type { FilterGroupRole } from "@/shared/api/categoryApi";

export interface FilterGroupRowEditValue {
  name: string;
  multiSelectYn: boolean;
  role: FilterGroupRole;
  sortOrder: number;
  useYn: boolean;
}

export interface FilterGroupFormValue {
  name: string;
  code: string;
  multiSelectYn: boolean;
  role: FilterGroupRole;
  sortOrder: number;
  useYn: boolean;
  description: string;
}

export interface FilterGroupSearchForm {
  keyword: string;
  multiSelectYnFilter: "" | "true" | "false";
  useYnFilter: "" | "true" | "false";
}
