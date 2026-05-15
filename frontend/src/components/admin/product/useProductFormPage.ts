import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import {
  apiCreateAdminItem,
  apiGetAdminItem,
  apiUpdateAdminItem,
  type AdminItemOptionRequest,
} from "@/shared/api/adminApi";
import { apiGetAdminFilterGroupsWithFilters } from "@/shared/api/admin/filterGroupApi";
import { apiUploadItemImage } from "@/shared/api/admin/uploadApi";
import {
  apiGetCategories,
  type CategoryFilterGroupResponse,
  type PublicCategoryItem,
} from "@/shared/api/categoryApi";
import { useModalStore } from "@/shared/store/modalStore";
import type { FormState } from "@/components/admin/product/productFormTypes";
import { INITIAL_FORM } from "@/components/admin/product/productFormTypes";
import type { ColorOptionDraft } from "@/components/admin/product/productFormTypes";

interface UseProductFormPageParams {
  mode: "create" | "edit";
}

function deriveItemKind(parentCategory: string): string {
  if (parentCategory === "신발") return "신발";
  if (["상의", "하의", "아우터"].includes(parentCategory)) return "의류";
  if (parentCategory === "액세서리") return "액세서리";
  return parentCategory;
}

function getParentCategoryName(categories: PublicCategoryItem[], categoryId: number): string {
  const category = categories.find((entry) => entry.id === categoryId);
  if (!category?.parentId) return "";
  return categories.find((entry) => entry.id === category.parentId)?.name ?? "";
}

export function useProductFormPage({ mode }: UseProductFormPageParams) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openAlert = useModalStore((state) => state.openAlert);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [categories, setCategories] = useState<PublicCategoryItem[]>([]);
  const [filterGroups, setFilterGroups] = useState<CategoryFilterGroupResponse[]>([]);
  const [filterGroupsLoading, setFilterGroupsLoading] = useState(false);

  useEffect(() => {
    if (filterGroups.length === 0 || !form.rentalPrice) return;

    const price = Number(form.rentalPrice);
    if (Number.isNaN(price) || price <= 0) return;

    const priceGroup = filterGroups.find((group) => group.filterGroupName === "가격");
    if (!priceGroup) return;

    let targetName = "";
    if (price <= 50000) targetName = "5만원 이하";
    else if (price <= 100000) targetName = "5만원 ~ 10만원";
    else if (price <= 200000) targetName = "10만원 ~ 20만원";
    else if (price <= 300000) targetName = "20만원 ~ 30만원";
    else targetName = "30만원 이상";

    const targetFilter = priceGroup.filters.find((filter) => filter.name === targetName);
    if (!targetFilter) return;

    const priceFilterIds = priceGroup.filters.map((filter) => filter.id);

    setForm((prev) => {
      const alreadySelected = prev.attributeTagIds.includes(targetFilter.id);
      const noOtherPriceSelected = !priceFilterIds.some(
        (filterId) =>
          filterId !== targetFilter.id && prev.attributeTagIds.includes(filterId),
      );

      if (alreadySelected && noOtherPriceSelected) return prev;

      return {
        ...prev,
        attributeTagIds: [
          ...prev.attributeTagIds.filter((filterId) => !priceFilterIds.includes(filterId)),
          targetFilter.id,
        ],
      };
    });
  }, [filterGroups, form.rentalPrice]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (mode === "edit") setIsDirty(true);
  }

  useEffect(() => {
    apiGetCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFilterGroupsLoading(true);

    apiGetAdminFilterGroupsWithFilters()
      .then((groups) => {
        if (cancelled) return;

        setFilterGroups(
          groups.map((group) => ({
            filterGroupId: group.id,
            filterGroupName: group.name,
            filterGroupCode: group.code,
            multiSelectYn: group.multiSelectYn,
            role: group.role,
            filters: group.filters,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setFilterGroups([]);
      })
      .finally(() => {
        if (!cancelled) setFilterGroupsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !id) return;

    apiGetAdminItem(Number(id))
      .then((item) => {
        const category = categories.find((entry) => entry.id === item.categoryId);

        setForm({
          name: item.name,
          brandId: item.brandId,
          brandName: item.brand ?? "",
          parentCategory: category?.parentId
            ? getParentCategoryName(categories, item.categoryId)
            : item.kind ?? "",
          categoryId: item.categoryId,
          categoryName: category?.name ?? item.category ?? "",
          retailPrice: String(item.retailPrice ?? ""),
          rentalPrice: String(item.rentalPrice ?? ""),
          itemMode: (item.itemMode as FormState["itemMode"]) || "AUCTION",
          status: (item.status as FormState["status"]) || "판매중",
          mainImg: item.img ?? "",
          subImgs: item.subImgs ?? [],
          attributeTagIds: item.tags.map((tag) => tag.id),
          optionItems: (item.optionItems ?? [])
            .filter((option) => option.tagId != null)
            .map((option) => ({
              tagId: option.tagId as number,
              quantity: String(option.quantity ?? 1),
              sortOrder: option.sortOrder,
            })),
          colorOptions: (item.optionItems ?? [])
            .filter((option) => option.tagId == null && !!option.name)
            .map((option) => ({
              colorName: option.name,
              quantity: String(option.quantity ?? 1),
            })),
          description: item.description ?? "",
        });
        setIsDirty(false);
      })
      .catch(() => {
        openAlert("error", "오류", "상품 정보를 불러오지 못했습니다.");
      });
  }, [categories, id, mode, openAlert]);

  async function handleMainImgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgUploading(true);
    try {
      const url = await apiUploadItemImage(file);
      setField("mainImg", url);
    } finally {
      setImgUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubImgChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgUploading(true);
    try {
      const url = await apiUploadItemImage(file);
      setForm((prev) => {
        const next = [...prev.subImgs];
        next[index] = url;
        return { ...prev, subImgs: next };
      });
    } finally {
      setImgUploading(false);
      e.target.value = "";
    }
  }

  function handleSubImgRemove(index: number) {
    setForm((prev) => {
      const next = [...prev.subImgs];
      next.splice(index, 1);
      return { ...prev, subImgs: next };
    });
  }

  function getGroupFilterIds(filterGroupId: number): number[] {
    return (
      filterGroups.find((group) => group.filterGroupId === filterGroupId)?.filters.map(
        (filter) => filter.id,
      ) ?? []
    );
  }

  // edit 모드에서 폼 직접 조작(필터/옵션) 시 dirty 처리
  function markDirty() {
    if (mode === "edit") setIsDirty(true);
  }

  // 이탈 차단: edit 모드 + 변경사항 있을 때만
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    mode === "edit" && isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  function toggleAttributeFilter(filterId: number, filterGroupId: number, multiSelectYn: boolean) {
    markDirty();
    setForm((prev) => {
      if (prev.attributeTagIds.includes(filterId)) {
        return {
          ...prev,
          attributeTagIds: prev.attributeTagIds.filter((value) => value !== filterId),
        };
      }

      if (!multiSelectYn) {
        const groupFilterIds = getGroupFilterIds(filterGroupId);
        return {
          ...prev,
          attributeTagIds: [
            ...prev.attributeTagIds.filter((value) => !groupFilterIds.includes(value)),
            filterId,
          ],
        };
      }

      return { ...prev, attributeTagIds: [...prev.attributeTagIds, filterId] };
    });
  }

  function toggleOptionFilter(filterId: number, filterGroupId: number, multiSelectYn: boolean) {
    markDirty();
    setForm((prev) => {
      const exists = prev.optionItems.some((entry) => entry.tagId === filterId);

      if (exists) {
        return {
          ...prev,
          optionItems: prev.optionItems.filter((entry) => entry.tagId !== filterId),
        };
      }

      if (!multiSelectYn) {
        const groupFilterIds = getGroupFilterIds(filterGroupId);
        return {
          ...prev,
          optionItems: [
            ...prev.optionItems.filter((entry) => !groupFilterIds.includes(entry.tagId)),
            { tagId: filterId, quantity: "1" },
          ],
        };
      }

      return {
        ...prev,
        optionItems: [...prev.optionItems, { tagId: filterId, quantity: "1" }],
      };
    });
  }

  function updateOptionQuantity(filterId: number, quantity: string) {
    markDirty();
    const digitsOnly = quantity.replace(/[^\d]/g, "");
    setForm((prev) => ({
      ...prev,
      optionItems: prev.optionItems.map((entry) =>
        entry.tagId === filterId ? { ...entry, quantity: digitsOnly } : entry,
      ),
    }));
  }

  function addColorOption() {
    markDirty();
    setForm((prev) => ({
      ...prev,
      colorOptions: [...prev.colorOptions, { colorName: "", quantity: "1" }],
    }));
  }

  function updateColorOption(index: number, field: keyof ColorOptionDraft, value: string) {
    markDirty();
    const sanitized = field === "quantity" ? value.replace(/[^\d]/g, "") : value;
    setForm((prev) => {
      const next = [...prev.colorOptions];
      next[index] = { ...next[index], [field]: sanitized };
      return { ...prev, colorOptions: next };
    });
  }

  function removeColorOption(index: number) {
    markDirty();
    setForm((prev) => ({
      ...prev,
      colorOptions: prev.colorOptions.filter((_, i) => i !== index),
    }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) nextErrors.name = "상품명을 입력해주세요.";
    if (!form.brandId) nextErrors.brandId = "브랜드를 선택해주세요.";
    if (!form.categoryId) nextErrors.categoryId = "카테고리를 선택해주세요.";

    if (!form.retailPrice.trim() || Number.isNaN(Number(form.retailPrice))) {
      nextErrors.retailPrice = "올바른 정가를 입력해주세요.";
    }

    if (
      form.itemMode !== "AUCTION" &&
      (!form.rentalPrice.trim() || Number.isNaN(Number(form.rentalPrice)))
    ) {
      nextErrors.rentalPrice = "올바른 대여 가격을 입력해주세요.";
    }

    if (
      form.optionItems.some((entry) => !entry.quantity.trim() || Number(entry.quantity) <= 0)
    ) {
      nextErrors.optionItems = "선택한 옵션의 수량은 1 이상이어야 합니다.";
    }

    if (form.colorOptions.some((o) => !o.colorName.trim())) {
      nextErrors.colorOptions = "색상명을 입력해주세요.";
    }
    if (form.colorOptions.some((o) => !o.quantity.trim() || Number(o.quantity) <= 0)) {
      nextErrors.colorOptions = "색상 옵션의 수량은 1 이상이어야 합니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        brandId: form.brandId,
        categoryId: form.categoryId,
        kind: deriveItemKind(form.parentCategory),
        retailPrice: Number(form.retailPrice),
        rentalPrice: form.itemMode !== "AUCTION" ? Number(form.rentalPrice) : null,
        itemMode: form.itemMode,
        status: form.status,
        description: form.description,
        img: form.mainImg,
        subImgs: form.subImgs,
        attributeTagIds: form.attributeTagIds,
        optionItems: [
          ...form.optionItems.map<AdminItemOptionRequest>((entry, index) => ({
            tagId: entry.tagId,
            quantity: Number(entry.quantity),
            sortOrder: entry.sortOrder ?? index,
          })),
          ...form.colorOptions
            .filter((o) => o.colorName.trim())
            .map<AdminItemOptionRequest>((o, i) => ({
              optionValue: o.colorName.trim(),
              quantity: Number(o.quantity) || 1,
              sortOrder: form.optionItems.length + i,
            })),
        ],
      };

      if (mode === "create") {
        await apiCreateAdminItem(payload);
      } else {
        await apiUpdateAdminItem(Number(id), payload);
      }

      setIsDirty(false);
      navigate("/admin/products");
    } catch (error) {
      console.error("상품 저장 실패:", error);
      openAlert("error", "저장 실패", "상품 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const infoChips = useMemo(
    () => [form.brandName, form.parentCategory, form.categoryName].filter(Boolean),
    [form.brandName, form.categoryName, form.parentCategory],
  );

  const attributeGroups = useMemo(
    () => filterGroups.filter((group) => group.role === "ATTRIBUTE"),
    [filterGroups],
  );
  const optionGroups = useMemo(
    () => filterGroups.filter((group) => group.role === "OPTION"),
    [filterGroups],
  );
  const generalGroups = useMemo(
    () => filterGroups.filter((group) => (!group.role || group.role === "ALL") && group.filterGroupName !== "할인율"),
    [filterGroups],
  );

  const selectedAttributeNames = useMemo(
    () =>
      attributeGroups.flatMap((group) =>
        group.filters
          .filter((filter) => form.attributeTagIds.includes(filter.id))
          .map((filter) => `${group.filterGroupName}: ${filter.name}`),
      ),
    [attributeGroups, form.attributeTagIds],
  );

  const selectedOptionSummaries = useMemo(
    () =>
      optionGroups.flatMap((group) =>
        group.filters
          .filter((filter) => form.optionItems.some((entry) => entry.tagId === filter.id))
          .map((filter) => {
            const selected = form.optionItems.find((entry) => entry.tagId === filter.id);
            return `${group.filterGroupName}: ${filter.name} / 수량 ${selected?.quantity || "1"}`;
          }),
      ),
    [form.optionItems, optionGroups],
  );

  const selectedFilterNames = useMemo(
    () =>
      generalGroups.flatMap((group) =>
        group.filters
          .filter((filter) => form.attributeTagIds.includes(filter.id))
          .map((filter) => `${group.filterGroupName}: ${filter.name}`),
      ),
    [generalGroups, form.attributeTagIds],
  );

  function onSelectBrand(brandId: number, brandName: string) {
    markDirty();
    setField("brandId", brandId);
    setForm((prev) => ({ ...prev, brandName }));
    setShowBrandModal(false);
  }

  function onSelectCategory(selected: {
    parentCategoryName: string;
    categoryId: number;
    categoryName: string;
  }) {
    markDirty();
    setForm((prev) => ({
      ...prev,
      parentCategory: selected.parentCategoryName,
      categoryId: selected.categoryId,
      categoryName: selected.categoryName,
    }));
    setErrors((prev) => ({ ...prev, categoryId: undefined }));
    setShowCategoryModal(false);
  }

  return {
    mode,
    navigate,
    form,
    errors,
    isDirty,
    blocker,
    submitting,
    imgUploading,
    showCategoryModal,
    showBrandModal,
    filterGroups,
    filterGroupsLoading,
    attributeGroups,
    optionGroups,
    generalGroups,
    infoChips,
    selectedAttributeNames,
    selectedOptionSummaries,
    selectedFilterNames,
    setField,
    setForm,
    setShowCategoryModal,
    setShowBrandModal,
    handleMainImgChange,
    handleSubImgChange,
    handleSubImgRemove,
    toggleAttributeFilter,
    toggleOptionFilter,
    updateOptionQuantity,
    addColorOption,
    updateColorOption,
    removeColorOption,
    handleSubmit,
    onSelectBrand,
    onSelectCategory,
  };
}
