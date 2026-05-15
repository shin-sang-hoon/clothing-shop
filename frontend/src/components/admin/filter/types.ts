export interface FilterRowEditValue {
  name: string;
  sortOrder: number;
  useYn: boolean;
}

export interface FilterFormValue {
  filterGroupId: number;
  name: string;
  code: string;
  sortOrder: number;
  useYn: boolean;
  colorHex: string;
  iconImageUrl: string;
  description: string;
}

export interface FilterSearchForm {
  filterGroupIdFilter: number | "";
  keyword: string;
  useYnFilter: "" | "true" | "false";
}
