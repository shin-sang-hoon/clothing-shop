export type ProductStatus = "판매중" | "품절" | "숨김";

export type OptionDraft = {
  tagId: number;
  quantity: string;
  sortOrder?: number;
};

export type ColorOptionDraft = {
  colorName: string;
  quantity: string;
};

export type FormState = {
  name: string;
  brandId: number;
  brandName: string;
  parentCategory: string;
  categoryId: number;
  categoryName: string;
  retailPrice: string;
  rentalPrice: string;
  itemMode: "AUCTION" | "RENTAL" | "BOTH";
  status: ProductStatus;
  mainImg: string;
  subImgs: string[];
  attributeTagIds: number[];
  optionItems: OptionDraft[];
  colorOptions: ColorOptionDraft[];
  description: string;
};

export const STATUS_OPTIONS: ProductStatus[] = ["판매중", "품절", "숨김"];

export const SUB_IMG_SLOTS = 10;

export const INITIAL_FORM: FormState = {
  name: "",
  brandId: 0,
  brandName: "",
  parentCategory: "",
  categoryId: 0,
  categoryName: "",
  retailPrice: "",
  rentalPrice: "",
  itemMode: "AUCTION",
  status: "판매중",
  mainImg: "",
  subImgs: [],
  attributeTagIds: [],
  optionItems: [],
  colorOptions: [],
  description: "",
};
