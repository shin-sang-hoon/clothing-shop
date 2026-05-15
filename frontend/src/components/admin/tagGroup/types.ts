import type { TagGroupRole } from "@/shared/api/categoryApi";

export interface TagGroupRowEditValue {
  name: string;
  multiSelectYn: boolean;
  role: TagGroupRole;
  sortOrder: number;
  useYn: boolean;
}

export interface TagGroupFormValue {
  name: string;
  code: string;
  multiSelectYn: boolean;
  role: TagGroupRole;
  sortOrder: number;
  useYn: boolean;
  description: string;
}

export interface TagGroupSearchForm {
  keyword: string;
  multiSelectYnFilter: "" | "true" | "false";
  useYnFilter: "" | "true" | "false";
}
