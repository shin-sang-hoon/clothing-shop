import { create } from "zustand";
import { apiGetCategories, type PublicCategoryItem } from "@/shared/api/categoryApi";

type CategoryState = {
  categories: PublicCategoryItem[];
  loaded: boolean;
  fetchCategories: () => Promise<void>;
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loaded: false,
  fetchCategories: async () => {
    if (get().loaded) return;
    try {
      const response = await apiGetCategories();
      const filtered = response.filter((c) => c.useYn !== false);
      set({ categories: filtered, loaded: true });
    } catch {}
  },
}));
