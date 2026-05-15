export interface TagRowEditValue {
  name: string;
  sortOrder: number;
  useYn: boolean;
}

export interface TagFormValue {
  name: string;
  code: string;
  sortOrder: number;
  useYn: boolean;
  description: string;
}

export interface TagSearchForm {
  keyword: string;
  useYnFilter: "" | "true" | "false";
}
