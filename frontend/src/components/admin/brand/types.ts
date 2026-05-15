export interface BrandRowEditValue {
  nameKo: string;
  nameEn: string;
  exclusiveYn: boolean;
  sortOrder: number;
  useYn: boolean;
}

export interface BrandFormValue {
  code: string;
  nameKo: string;
  nameEn: string;
  iconImageUrl: string;
  exclusiveYn: boolean;
  sortOrder: number;
  useYn: boolean;
  description: string;
}

export interface BrandSearchForm {
  keyword: string;
  exclusiveYnFilter: "" | "true" | "false";
  useYnFilter: "" | "true" | "false";
}
