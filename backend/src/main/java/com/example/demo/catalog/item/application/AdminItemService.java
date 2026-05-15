package com.example.demo.catalog.item.application;

import com.example.demo.catalog.brand.domain.Brand;
import com.example.demo.catalog.brand.domain.BrandRepository;
import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryRepository;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterGroupRole;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.crawl.application.ItemCrawlImageStorageService;
import com.example.demo.catalog.crawl.application.MusinsaCrawlerExecutor;
import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemFilter;
import com.example.demo.catalog.item.domain.ItemFilterRepository;
import com.example.demo.catalog.item.domain.ItemImage;
import com.example.demo.catalog.item.domain.ItemImageRepository;
import com.example.demo.catalog.item.domain.ItemImageType;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.catalog.item.domain.ItemTag;
import com.example.demo.catalog.item.domain.ItemTagRepository;
import com.example.demo.catalog.item.domain.ItemViewLogRepository;
import com.example.demo.catalog.item.dto.AdminItemDtos;
import com.example.demo.catalog.tag.domain.Tag;
import com.example.demo.catalog.tag.domain.TagRepository;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.security.HtmlSanitizer;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.global.upload.ItemUploadStorageService;
import com.example.demo.like.domain.ItemLikeRepository;
import com.example.demo.trade.domain.ItemOption;
import com.example.demo.trade.domain.ItemOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminItemService {

        private final ItemRepository itemRepository;
        private final ItemImageRepository itemImageRepository;
        private final ItemFilterRepository itemFilterRepository;
        private final BrandRepository brandRepository;
        private final CategoryRepository categoryRepository;
        private final FilterRepository filterRepository;
        private final ItemOptionRepository itemOptionRepository;
        private final ItemTagRepository itemTagRepository;
        private final ItemLikeRepository itemLikeRepository;
        private final ItemViewLogRepository itemViewLogRepository;
        private final TagRepository tagRepository;
        private final ItemUploadStorageService itemUploadStorageService;
        private final ItemFilterTagSyncService itemFilterTagSyncService;
        private final HtmlSanitizer htmlSanitizer;
        private final MusinsaCrawlerExecutor musinsaCrawlerExecutor;
        private final ItemCrawlImageStorageService itemCrawlImageStorageService;
        private final PlatformTransactionManager transactionManager;

        /**
         * 관리자 상품 목록 조회
         *
         * 병합 반영:
         * - hasFilter
         * - hasAttribute
         * - itemMode
         *
         * 주의:
         * - 기본 검색/상태/카테고리/tagId/itemMode는 repository 조회에 위임
         * - hasFilter / hasAttribute 는 현재 서비스에서 후처리
         */
        @Transactional(readOnly = true)
        public PageResponse<AdminItemDtos.ItemListResponse> getItems(
                        int page,
                        int size,
                        String keyword,
                        String kind,
                        String status,
                        Long categoryId,
                        Long tagId,
                        Boolean hasFilter,
                        Boolean hasAttribute,
                        String itemMode) {
                // 페이지 정보 생성
                Pageable pageable = createPageable(page, size);

                // 검색 파라미터 정규화
                String normalizedKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
                String normalizedKind = (kind == null || kind.isBlank()) ? null : kind.trim();
                String normalizedStatus = (status == null || status.isBlank()) ? null : status.trim();
                String normalizedItemMode = (itemMode == null || itemMode.isBlank())
                                ? null
                                : itemMode.trim().toUpperCase(Locale.ROOT);

                // 기본 목록 조회
                Page<Item> itemPage = itemRepository.findAdminItemsPaged(
                                normalizedKeyword,
                                normalizedKind,
                                normalizedStatus,
                                categoryId,
                                tagId,
                                Boolean.TRUE.equals(hasFilter),
                                Boolean.TRUE.equals(hasAttribute),
                                normalizedItemMode,
                                pageable);

                // 현재 페이지 아이템 목록
                List<Item> items = itemPage.getContent();

                // 상품 ID 목록
                List<Long> itemIds = items.stream()
                                .map(Item::getId)
                                .toList();

                // 대표 이미지 맵
                Map<Long, String> mainImageMap = buildMainImageMap(itemIds);

                // RENTAL / BOTH 인 경우 옵션 조회
                List<Long> rentalItemIds = items.stream()
                                .filter(i -> "RENTAL".equals(i.getItemMode()) || "BOTH".equals(i.getItemMode()))
                                .map(Item::getId)
                                .toList();

                Map<Long, List<ItemOption>> optionMap = rentalItemIds.isEmpty()
                                ? Collections.emptyMap()
                                : itemOptionRepository.findByItemIdIn(rentalItemIds).stream()
                                                .collect(Collectors.groupingBy(o -> o.getItem().getId()));

                List<AdminItemDtos.ItemListResponse> content = items.stream()
                                .map(item -> toAdminListResponse(
                                                item,
                                                mainImageMap.get(item.getId()),
                                                optionMap.getOrDefault(item.getId(), Collections.emptyList())))
                                .toList();

                return toPageResponse(content, itemPage);
        }

        @Transactional
        public Map<String, Object> initRentalStock() {
                List<Item> itemsWithoutOptions = itemRepository.findRentalItemsWithoutOptions();
                for (Item item : itemsWithoutOptions) {
                        ItemOption option = new ItemOption();
                        option.setItem(item);
                        option.setOptionValue("기본");
                        option.setQuantity(5);
                        option.setSortOrder(0);
                        itemOptionRepository.save(option);
                }
                return Map.of("initialized", itemsWithoutOptions.size());
        }

        @Transactional
        public int bulkDeleteItems(List<Long> itemIds) {
                if (itemIds == null || itemIds.isEmpty()) {
                        return 0;
                }
                List<Long> normalized = itemIds.stream()
                                .filter(Objects::nonNull)
                                .filter(id -> id > 0)
                                .distinct()
                                .toList();
                if (normalized.isEmpty()) {
                        return 0;
                }
                int deleted = 0;
                for (Long itemId : normalized) {
                        deleteItem(itemId);
                        deleted++;
                }
                return deleted;
        }

        @Transactional
        public Map<String, Object> bulkRefreshItemImages(List<Long> itemIds) {
                if (itemIds == null || itemIds.isEmpty()) {
                        return Map.of("requested", 0, "refreshed", 0, "failed", 0);
                }

                List<Long> normalized = itemIds.stream()
                                .filter(Objects::nonNull)
                                .filter(id -> id > 0)
                                .distinct()
                                .toList();
                if (normalized.isEmpty()) {
                        return Map.of("requested", 0, "refreshed", 0, "failed", 0);
                }

                AtomicInteger refreshed = new AtomicInteger(0);
                AtomicInteger failed = new AtomicInteger(0);
                ExecutorService executorService = Executors.newFixedThreadPool(4);
                TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

                for (Long itemId : normalized) {
                        executorService.submit(() -> {
                                try {
                                        transactionTemplate.executeWithoutResult(status -> refreshSingleItemImages(itemId));
                                        refreshed.incrementAndGet();
                                } catch (Exception exception) {
                                        failed.incrementAndGet();
                                }
                        });
                }

                executorService.shutdown();
                try {
                        if (!executorService.awaitTermination(10, TimeUnit.MINUTES)) {
                                executorService.shutdownNow();
                        }
                } catch (InterruptedException interruptedException) {
                        Thread.currentThread().interrupt();
                        executorService.shutdownNow();
                }

                return Map.of(
                                "requested", normalized.size(),
                                "refreshed", refreshed.get(),
                                "failed", failed.get());
        }

        @Transactional
        public Map<String, Object> refreshMainThumbnailForAllItems() {
                List<Long> allItemIds = itemRepository.findAll().stream()
                                .map(Item::getId)
                                .filter(Objects::nonNull)
                                .toList();
                if (allItemIds.isEmpty()) {
                        return Map.of("requested", 0, "refreshed", 0, "failed", 0);
                }

                AtomicInteger refreshed = new AtomicInteger(0);
                AtomicInteger failed = new AtomicInteger(0);
                ExecutorService executorService = Executors.newFixedThreadPool(4);
                TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

                for (Long itemId : allItemIds) {
                        executorService.submit(() -> {
                                try {
                                        transactionTemplate.executeWithoutResult(status -> refreshSingleItemMainThumbnail(itemId));
                                        refreshed.incrementAndGet();
                                } catch (Exception exception) {
                                        failed.incrementAndGet();
                                }
                        });
                }

                executorService.shutdown();
                try {
                        if (!executorService.awaitTermination(10, TimeUnit.MINUTES)) {
                                executorService.shutdownNow();
                        }
                } catch (InterruptedException interruptedException) {
                        Thread.currentThread().interrupt();
                        executorService.shutdownNow();
                }

                return Map.of(
                                "requested", allItemIds.size(),
                                "refreshed", refreshed.get(),
                                "failed", failed.get());
        }

        @Transactional(readOnly = true)
        public PageResponse<AdminItemDtos.ItemListResponse> getNoFilterItemsByCategoryId(
                        Long categoryId,
                        int page,
                        int size,
                        String itemMode) {
                if (categoryId == null || categoryId <= 0) {
                        throw new IllegalArgumentException("categoryId는 필수입니다.");
                }

                Pageable pageable = createPageable(page, size);
                String normalizedItemMode = normalizeText(itemMode);
                if (normalizedItemMode != null) {
                        normalizedItemMode = normalizedItemMode.toUpperCase(Locale.ROOT);
                }

                Page<Item> itemPage = itemRepository.findActiveWithoutFilterByCategoryIdPaged(
                                categoryId,
                                normalizedItemMode,
                                pageable);

                List<Long> itemIds = itemPage.getContent().stream().map(Item::getId).toList();
                Map<Long, String> mainImageMap = buildMainImageMap(itemIds);

                List<AdminItemDtos.ItemListResponse> content = itemPage.getContent().stream()
                                .map(item -> toAdminListResponse(item, mainImageMap.get(item.getId())))
                                .toList();

                return toPageResponse(content, itemPage);
        }

        @Transactional(readOnly = true)
        public PageResponse<AdminItemDtos.ItemListResponse> getNoTagItemsByCategoryId(
                        Long categoryId,
                        int page,
                        int size,
                        String itemMode) {
                if (categoryId == null || categoryId <= 0) {
                        throw new IllegalArgumentException("categoryId는 필수입니다.");
                }

                Pageable pageable = createPageable(page, size);
                String normalizedItemMode = normalizeText(itemMode);
                if (normalizedItemMode != null) {
                        normalizedItemMode = normalizedItemMode.toUpperCase(Locale.ROOT);
                }

                Page<Item> itemPage = itemRepository.findActiveWithoutTagByCategoryIdPaged(
                                categoryId,
                                normalizedItemMode,
                                pageable);

                List<Long> itemIds = itemPage.getContent().stream().map(Item::getId).toList();
                Map<Long, String> mainImageMap = buildMainImageMap(itemIds);

                List<AdminItemDtos.ItemListResponse> content = itemPage.getContent().stream()
                                .map(item -> toAdminListResponse(item, mainImageMap.get(item.getId())))
                                .toList();

                return toPageResponse(content, itemPage);
        }

        /**
         * 특정 태그 이름을 가진 상품의 itemMode를 일괄 변경
         */
        @Transactional
        public int bulkUpdateItemModeByTagName(String tagName, String mode) {
                return itemRepository.updateItemModeByTagName(tagName, mode);
        }

        /**
         * 가격이 minPrice 이상인 상품에 특정 태그를 일괄 추가
         */
        @Transactional
        public int addTagToItemsByMinPrice(String tagName, int minPrice) {
                Tag tag = tagRepository.findByUseYnTrueOrderBySortOrderAscIdAsc().stream()
                                .filter(t -> t.getName().equals(tagName))
                                .findFirst()
                                .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다: " + tagName));

                List<Item> items = itemRepository.findByRetailPriceGreaterThanEqual(minPrice);
                Set<Long> existingItemIds = itemTagRepository.findByItemIdInWithTag(
                                items.stream().map(Item::getId).toList()).stream()
                                .filter(it -> it.getTag().getId().equals(tag.getId()))
                                .map(it -> it.getItem().getId())
                                .collect(Collectors.toSet());

                int added = 0;
                for (Item item : items) {
                        if (existingItemIds.contains(item.getId())) {
                                continue;
                        }
                        ItemTag itemTag = new ItemTag();
                        itemTag.setItem(item);
                        itemTag.setTag(tag);
                        itemTagRepository.save(itemTag);
                        added++;
                }
                return added;
        }

        /**
         * 카테고리 코드 기준으로 부티크 아이템 itemMode 일괄 변경
         * - retailPrice >= threshold → itemMode = RENTAL
         * - retailPrice < threshold → itemMode = AUCTION
         */
        @Transactional
        public Map<String, Object> syncBoutiqueByPrice(String categoryCode, int threshold) {
                List<Item> boutiqueItems = itemRepository.findByCategoryCodeForSync(categoryCode);

                List<Long> rentalIds = boutiqueItems.stream()
                                .filter(i -> i.getRetailPrice() != null && i.getRetailPrice() >= threshold)
                                .map(Item::getId)
                                .toList();

                List<Long> auctionIds = boutiqueItems.stream()
                                .filter(i -> i.getRetailPrice() == null || i.getRetailPrice() < threshold)
                                .map(Item::getId)
                                .toList();

                int modeToRental = rentalIds.isEmpty() ? 0 : itemRepository.updateItemModeByIds(rentalIds, "RENTAL");
                int modeToAuction = auctionIds.isEmpty() ? 0
                                : itemRepository.updateItemModeByIds(auctionIds, "AUCTION");

                return Map.of(
                                "categoryCode", categoryCode,
                                "totalCount", boutiqueItems.size(),
                                "modeToRental", modeToRental,
                                "modeToAuction", modeToAuction);
        }

        @Transactional(readOnly = true)
        public AdminItemDtos.ItemDetailResponse getItem(Long itemId) {
                Item item = itemRepository.findByIdWithBrandAndCategory(itemId)
                                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + itemId));

                List<ItemImage> images = itemImageRepository.findByItemIdOrderByImageTypeAscSortOrderAsc(itemId);
                List<ItemFilter> itemFilters = itemFilterRepository.findByItemIdWithTag(itemId);
                List<ItemOption> itemOptions = itemOptionRepository.findByItemIdOrderBySortOrderAscIdAsc(itemId);

                return toAdminDetailResponse(item, images, itemFilters, itemOptions);
        }

        @Transactional
        public AdminItemDtos.ItemDetailResponse createItem(AdminItemDtos.CreateItemRequest req) {
                Brand brand = resolveBrand(req.brandId());
                Category category = resolveCategory(req.categoryId());

                Item item = new Item();
                item.setItemNo(UUID.randomUUID().toString().replace("-", "").substring(0, 9).toUpperCase());
                applyFields(
                                item,
                                req.name(),
                                brand,
                                category,
                                req.kind(),
                                req.retailPrice(),
                                req.rentalPrice(),
                                req.itemMode(),
                                req.status(),
                                req.description());

                Item savedItem = itemRepository.save(item);
                savedItem.setItemNo(String.format("%09d", savedItem.getId()));
                savedItem.setDetailContent(
                                htmlSanitizer.sanitizeRichText(
                                                itemUploadStorageService.replaceContentImageUrls(savedItem.getId(),
                                                                req.description())));
                itemRepository.save(savedItem);

                saveImages(savedItem, req.img(), req.subImgs());
                saveAttributesAndOptions(savedItem, req.attributeTagIds(), req.optionItems());
                itemFilterTagSyncService.syncForItem(savedItem, null, null);

                List<ItemImage> images = itemImageRepository
                                .findByItemIdOrderByImageTypeAscSortOrderAsc(savedItem.getId());
                List<ItemFilter> itemFilters = itemFilterRepository.findByItemIdWithTag(savedItem.getId());
                List<ItemOption> itemOptions = itemOptionRepository
                                .findByItemIdOrderBySortOrderAscIdAsc(savedItem.getId());

                return toAdminDetailResponse(savedItem, images, itemFilters, itemOptions);
        }

        @Transactional
        public AdminItemDtos.ItemDetailResponse updateItem(Long itemId, AdminItemDtos.UpdateItemRequest req) {
                Item item = itemRepository.findByIdWithBrandAndCategory(itemId)
                                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + itemId));

                Long previousCategoryId = item.getCategory() != null ? item.getCategory().getId() : null;
                Long previousBrandId = item.getBrand() != null ? item.getBrand().getId() : null;

                Brand brand = resolveBrand(req.brandId());
                Category category = resolveCategory(req.categoryId());

                applyFields(
                                item,
                                req.name(),
                                brand,
                                category,
                                req.kind(),
                                req.retailPrice(),
                                req.rentalPrice(),
                                req.itemMode(),
                                req.status(),
                                req.description());
                item.setDetailContent(
                                htmlSanitizer.sanitizeRichText(
                                                itemUploadStorageService.replaceContentImageUrls(item.getId(),
                                                                req.description())));

                itemImageRepository.deleteByItemId(itemId);
                saveImages(item, req.img(), req.subImgs());

                itemFilterRepository.deleteByItemId(itemId);
                itemOptionRepository.deleteByItemId(itemId);
                saveAttributesAndOptions(item, req.attributeTagIds(), req.optionItems());
                itemFilterTagSyncService.syncForItem(item, previousCategoryId, previousBrandId);

                List<ItemImage> images = itemImageRepository.findByItemIdOrderByImageTypeAscSortOrderAsc(itemId);
                List<ItemFilter> itemFilters = itemFilterRepository.findByItemIdWithTag(itemId);
                List<ItemOption> itemOptions = itemOptionRepository.findByItemIdOrderBySortOrderAscIdAsc(itemId);

                return toAdminDetailResponse(item, images, itemFilters, itemOptions);
        }

        /**
         * 아이템 삭제
         * - item_image, item_filter, item_option 레코드 먼저 삭제
         * - category_tag_map, brand_tag_map 재빌드
         * - item 본체 삭제
         */
        @Transactional
        public void deleteItem(Long itemId) {
                Item item = itemRepository.findByIdWithBrandAndCategory(itemId)
                                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + itemId));

                Long categoryId = item.getCategory() != null ? item.getCategory().getId() : null;
                Long brandId = item.getBrand() != null ? item.getBrand().getId() : null;

                // 관련 테이블 정리
                itemTagRepository.deleteByItemId(itemId);
                itemLikeRepository.deleteByItemId(itemId);
                itemViewLogRepository.deleteByItemId(itemId);
                itemImageRepository.deleteByItemId(itemId);
                itemFilterRepository.deleteByItemId(itemId);
                itemOptionRepository.deleteByItemId(itemId);
                itemRepository.delete(item);

                // 매핑 테이블 재빌드
                itemFilterTagSyncService.syncAfterDelete(categoryId, brandId);
        }

        @Transactional
        public AdminItemDtos.ItemDetailResponse updateUseYn(Long itemId, AdminItemDtos.UpdateItemUseRequest req) {
                Item item = itemRepository.findByIdWithBrandAndCategory(itemId)
                                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + itemId));

                item.setUseYn(Boolean.TRUE.equals(req.useYn()));
                itemFilterTagSyncService.syncForItem(
                                item,
                                item.getCategory() != null ? item.getCategory().getId() : null,
                                item.getBrand() != null ? item.getBrand().getId() : null);

                List<ItemImage> images = itemImageRepository.findByItemIdOrderByImageTypeAscSortOrderAsc(itemId);
                List<ItemFilter> itemFilters = itemFilterRepository.findByItemIdWithTag(itemId);
                List<ItemOption> itemOptions = itemOptionRepository.findByItemIdOrderBySortOrderAscIdAsc(itemId);

                return toAdminDetailResponse(item, images, itemFilters, itemOptions);
        }

        private void applyFields(
                        Item item,
                        String name,
                        Brand brand,
                        Category category,
                        String kind,
                        Integer retailPrice,
                        Integer rentalPrice,
                        String itemMode,
                        String status,
                        String description) {
                item.setName(name != null ? name.trim() : "");
                item.setBrand(brand);
                item.setCategory(category);
                item.setKind(kind);
                item.setRetailPrice(retailPrice);
                item.setRentalPrice(rentalPrice);
                item.setItemMode(itemMode);
                item.setStatus(status != null && !status.isBlank() ? status : "판매중");
                item.setDetailContent(htmlSanitizer.sanitizeRichText(description));
        }

        private Brand resolveBrand(Long brandId) {
                if (brandId == null) {
                        return null;
                }
                return brandRepository.findById(brandId)
                                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId));
        }

        private Category resolveCategory(Long categoryId) {
                if (categoryId == null) {
                        return null;
                }
                return categoryRepository.findById(categoryId)
                                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다. id=" + categoryId));
        }

        private void saveImages(Item item, String mainImg, List<String> subImgs) {
                if (mainImg != null && !mainImg.isBlank()) {
                        ItemImage main = new ItemImage();
                        main.setItem(item);
                        main.setImageType(ItemImageType.MAIN);
                        main.setImageUrl(itemUploadStorageService.moveToThumbnailFolder(item.getId(), mainImg.trim()));
                        main.setSortOrder(0);
                        itemImageRepository.save(main);
                }

                if (subImgs == null) {
                        return;
                }

                List<String> valid = subImgs.stream()
                                .filter(url -> url != null && !url.isBlank())
                                .limit(5)
                                .toList();

                for (int i = 0; i < valid.size(); i++) {
                        ItemImage sub = new ItemImage();
                        sub.setItem(item);
                        sub.setImageType(ItemImageType.SUB);
                        sub.setImageUrl(itemUploadStorageService.moveToThumbnailFolder(item.getId(),
                                        valid.get(i).trim()));
                        sub.setSortOrder(i);
                        itemImageRepository.save(sub);
                }
        }

        private void saveAttributesAndOptions(
                        Item item,
                        List<Long> attributeTagIds,
                        List<AdminItemDtos.ItemOptionRequest> optionItems) {
                List<Long> normalizedAttributeTagIds = normalizeAttributeTagIds(attributeTagIds);
                List<AdminItemDtos.ItemOptionRequest> normalizedOptionItems = normalizeOptionItems(optionItems);

                Map<Long, Filter> tagById = loadTags(normalizedAttributeTagIds, normalizedOptionItems);

                List<Filter> attributeTags = normalizedAttributeTagIds.stream()
                                .map(tagById::get)
                                .filter(Objects::nonNull)
                                .filter(this::canUseAsAttribute)
                                .toList();

                for (Filter tag : attributeTags) {
                        ItemFilter itemFilter = new ItemFilter();
                        itemFilter.setItem(item);
                        itemFilter.setTag(tag);
                        itemFilterRepository.save(itemFilter);
                }

                for (int index = 0; index < normalizedOptionItems.size(); index++) {
                        AdminItemDtos.ItemOptionRequest optionItem = normalizedOptionItems.get(index);

                        ItemOption itemOption = new ItemOption();
                        itemOption.setItem(item);
                        itemOption.setQuantity(optionItem.quantity() != null && optionItem.quantity() > 0
                                        ? optionItem.quantity()
                                        : 1);
                        itemOption.setSortOrder(optionItem.sortOrder() != null ? optionItem.sortOrder() : index);

                        if (optionItem.tagId() != null && optionItem.tagId() > 0) {
                                Filter tag = tagById.get(optionItem.tagId());
                                if (tag == null || !canUseAsOption(tag)) {
                                        continue;
                                }
                                itemOption.setSourceTag(tag);
                                itemOption.setOptionValue(tag.getName());
                        } else if (optionItem.optionValue() != null && !optionItem.optionValue().isBlank()) {
                                itemOption.setOptionValue(optionItem.optionValue().trim());
                        } else {
                                continue;
                        }

                        itemOptionRepository.save(itemOption);
                }
        }

        private List<Long> normalizeAttributeTagIds(List<Long> attributeTagIds) {
                if (attributeTagIds == null || attributeTagIds.isEmpty()) {
                        return List.of();
                }

                return attributeTagIds.stream()
                                .filter(id -> id != null && id > 0)
                                .collect(Collectors.collectingAndThen(
                                                Collectors.toCollection(LinkedHashSet::new),
                                                List::copyOf));
        }

        private List<AdminItemDtos.ItemOptionRequest> normalizeOptionItems(
                        List<AdminItemDtos.ItemOptionRequest> optionItems) {
                if (optionItems == null || optionItems.isEmpty()) {
                        return List.of();
                }

                Map<String, AdminItemDtos.ItemOptionRequest> deduped = new LinkedHashMap<>();
                for (AdminItemDtos.ItemOptionRequest optionItem : optionItems) {
                        if (optionItem == null) {
                                continue;
                        }

                        int qty = optionItem.quantity() != null && optionItem.quantity() > 0 ? optionItem.quantity()
                                        : 1;

                        if (optionItem.tagId() != null && optionItem.tagId() > 0) {
                                String key = "tag:" + optionItem.tagId();
                                deduped.put(key, new AdminItemDtos.ItemOptionRequest(
                                                optionItem.tagId(),
                                                null,
                                                qty,
                                                optionItem.sortOrder()));
                        } else if (optionItem.optionValue() != null && !optionItem.optionValue().isBlank()) {
                                String key = "text:" + optionItem.optionValue().trim().toLowerCase(Locale.ROOT);
                                deduped.putIfAbsent(key, new AdminItemDtos.ItemOptionRequest(
                                                null,
                                                optionItem.optionValue().trim(),
                                                qty,
                                                optionItem.sortOrder()));
                        }
                }

                return List.copyOf(deduped.values());
        }

        private Map<Long, Filter> loadTags(
                        List<Long> attributeTagIds,
                        List<AdminItemDtos.ItemOptionRequest> optionItems) {
                LinkedHashSet<Long> allTagIds = new LinkedHashSet<>(attributeTagIds);
                optionItems.stream()
                                .map(AdminItemDtos.ItemOptionRequest::tagId)
                                .filter(tagId -> tagId != null && tagId > 0)
                                .forEach(allTagIds::add);

                return filterRepository.findAllById(allTagIds).stream()
                                .collect(Collectors.toMap(
                                                Filter::getId,
                                                tag -> tag,
                                                (a, b) -> a,
                                                LinkedHashMap::new));
        }

        private boolean canUseAsAttribute(Filter tag) {
                FilterGroupRole role = tag.getFilterGroup().getRole() != null
                                ? tag.getFilterGroup().getRole()
                                : FilterGroupRole.ALL;
                return role == FilterGroupRole.ATTRIBUTE || role == FilterGroupRole.ALL;
        }

        private boolean canUseAsOption(Filter tag) {
                FilterGroupRole role = tag.getFilterGroup().getRole() != null
                                ? tag.getFilterGroup().getRole()
                                : FilterGroupRole.ALL;
                return role == FilterGroupRole.OPTION || role == FilterGroupRole.ALL;
        }

        private Map<Long, String> buildMainImageMap(List<Long> itemIds) {
                if (itemIds.isEmpty()) {
                        return Collections.emptyMap();
                }

                return itemImageRepository.findByItemIdInAndImageTypeOrderByItemIdAscSortOrderAsc(
                                itemIds,
                                ItemImageType.MAIN).stream()
                                .collect(Collectors.toMap(
                                                img -> img.getItem().getId(),
                                                ItemImage::getImageUrl,
                                                (a, b) -> a));
        }

        private void saveCrawledImages(Item item, CatalogCrawlDtos.CrawlItemItem crawledItem) {
                Map<String, String> storedBySourceUrl = new LinkedHashMap<>();
                Set<String> usedSubSourceUrls = new LinkedHashSet<>();
                List<String> storedSubUrls = new java.util.ArrayList<>();

                String thumbnailUrl = null;
                try {
                        String thumbnailSource = normalizeText(crawledItem.thumbnailImageUrl());
                        if (thumbnailSource != null) {
                                thumbnailUrl = storeThumbnailOnce(item.getId(), thumbnailSource, storedBySourceUrl);
                                usedSubSourceUrls.add(thumbnailSource);
                        }
                } catch (Exception ignored) {
                        // skip
                }

                if (thumbnailUrl != null) {
                        itemImageRepository.deleteByItemIdAndImageType(item.getId(), ItemImageType.MAIN);
                        ItemImage mainImage = new ItemImage();
                        mainImage.setItem(item);
                        mainImage.setImageType(ItemImageType.MAIN);
                        mainImage.setImageUrl(thumbnailUrl);
                        mainImage.setSortOrder(0);
                        itemImageRepository.save(mainImage);
                }

                List<String> detailImages = crawledItem.goodsImageUrls() != null ? crawledItem.goodsImageUrls()
                                : List.of();
                Set<String> dedupedImageUrls = new LinkedHashSet<>(detailImages);
                if (!dedupedImageUrls.isEmpty()) {
                        itemImageRepository.deleteByItemIdAndImageType(item.getId(), ItemImageType.SUB);
                        int sortOrder = 0;
                        for (String imageUrl : dedupedImageUrls) {
                                String sourceUrl = normalizeText(imageUrl);
                                if (sourceUrl == null || usedSubSourceUrls.contains(sourceUrl)) {
                                        continue;
                                }
                                String storedUrl;
                                try {
                                        storedUrl = storeThumbnailOnce(item.getId(), sourceUrl, storedBySourceUrl);
                                } catch (Exception ignored) {
                                        continue;
                                }
                                if (storedUrl == null) {
                                        continue;
                                }
                                usedSubSourceUrls.add(sourceUrl);

                                ItemImage subImage = new ItemImage();
                                subImage.setItem(item);
                                subImage.setImageType(ItemImageType.SUB);
                                subImage.setImageUrl(storedUrl);
                                subImage.setSortOrder(sortOrder++);
                                itemImageRepository.save(subImage);
                                storedSubUrls.add(storedUrl);
                        }
                }

                // 썸네일이 없더라도 최소 1개의 MAIN 이미지는 보장한다.
                if (thumbnailUrl == null && !storedSubUrls.isEmpty()) {
                        itemImageRepository.deleteByItemIdAndImageType(item.getId(), ItemImageType.MAIN);
                        ItemImage fallbackMainImage = new ItemImage();
                        fallbackMainImage.setItem(item);
                        fallbackMainImage.setImageType(ItemImageType.MAIN);
                        fallbackMainImage.setImageUrl(storedSubUrls.get(0));
                        fallbackMainImage.setSortOrder(0);
                        itemImageRepository.save(fallbackMainImage);
                }

                String crawledContent = normalizeText(crawledItem.goodsContents());
                if (crawledContent != null) {
                        try {
                                String replacedContent = itemCrawlImageStorageService.replaceContentImageUrls(
                                                item.getId(),
                                                crawledContent);
                                item.setDetailContent(htmlSanitizer.sanitizeRichText(replacedContent));
                        } catch (Exception ignored) {
                                item.setDetailContent(htmlSanitizer.sanitizeRichText(crawledContent));
                        }
                        itemRepository.save(item);
                }
        }

        private void refreshSingleItemImages(Long itemId) {
                Item item = itemRepository.findById(itemId)
                                .orElseThrow(() -> new IllegalArgumentException("item not found"));

                String itemNo = normalizeText(item.getItemNo());
                if (itemNo == null) {
                        throw new IllegalArgumentException("item_no is empty");
                }

                CatalogCrawlDtos.CrawlResponse response = musinsaCrawlerExecutor.executeItemImage(itemNo);
                List<CatalogCrawlDtos.CrawlItemItem> crawledItems = response.items() != null ? response.items() : List.of();
                if (crawledItems.isEmpty()) {
                        throw new IllegalStateException("no crawled image result");
                }

                saveCrawledImages(item, crawledItems.get(0));
        }

        private void refreshSingleItemMainThumbnail(Long itemId) {
                Item item = itemRepository.findById(itemId)
                                .orElseThrow(() -> new IllegalArgumentException("item not found"));

                String itemNo = normalizeText(item.getItemNo());
                if (itemNo == null) {
                        throw new IllegalArgumentException("item_no is empty");
                }

                CatalogCrawlDtos.CrawlResponse response = musinsaCrawlerExecutor.executeItemImage(itemNo);
                List<CatalogCrawlDtos.CrawlItemItem> crawledItems = response.items() != null ? response.items() : List.of();
                if (crawledItems.isEmpty()) {
                        throw new IllegalStateException("no crawled image result");
                }
                CatalogCrawlDtos.CrawlItemItem crawledItem = crawledItems.get(0);

                String sourceUrl = normalizeText(crawledItem.thumbnailImageUrl());
                if (sourceUrl == null) {
                        sourceUrl = crawledItem.goodsImageUrls() != null
                                        ? crawledItem.goodsImageUrls().stream().map(this::normalizeText).filter(Objects::nonNull)
                                                        .findFirst().orElse(null)
                                        : null;
                }
                if (sourceUrl == null) {
                        throw new IllegalStateException("thumbnail source not found");
                }

                String storedUrl;
                try {
                        storedUrl = itemCrawlImageStorageService.storeThumbnailImage(item.getId(), sourceUrl);
                } catch (Exception exception) {
                        throw new IllegalStateException("thumbnail store failed", exception);
                }
                if (storedUrl == null) {
                        throw new IllegalStateException("thumbnail store empty");
                }

                itemImageRepository.deleteByItemIdAndImageType(item.getId(), ItemImageType.MAIN);
                ItemImage mainImage = new ItemImage();
                mainImage.setItem(item);
                mainImage.setImageType(ItemImageType.MAIN);
                mainImage.setImageUrl(storedUrl);
                mainImage.setSortOrder(0);
                itemImageRepository.save(mainImage);
        }

        private String storeThumbnailOnce(Long itemId, String sourceUrl, Map<String, String> storedBySourceUrl)
                        throws Exception {
                if (storedBySourceUrl.containsKey(sourceUrl)) {
                        return storedBySourceUrl.get(sourceUrl);
                }
                String stored = itemCrawlImageStorageService.storeThumbnailImage(itemId, sourceUrl);
                storedBySourceUrl.put(sourceUrl, stored);
                return stored;
        }

        private AdminItemDtos.ItemListResponse toAdminListResponse(Item item, String mainImg) {
                return toAdminListResponse(item, mainImg, Collections.emptyList());
        }

        private AdminItemDtos.ItemListResponse toAdminListResponse(Item item, String mainImg,
                        List<ItemOption> options) {
                List<AdminItemDtos.ItemOptionValue> optionValues = options.stream()
                                .map(o -> new AdminItemDtos.ItemOptionValue(
                                                o.getId(),
                                                o.getSourceTag() != null ? o.getSourceTag().getId() : null,
                                                o.getOptionValue(),
                                                o.getQuantity(),
                                                o.getSortOrder()))
                                .toList();

                return new AdminItemDtos.ItemListResponse(
                                item.getId(),
                                item.getName(),
                                item.getBrand() != null ? item.getBrand().getId() : null,
                                item.getBrand() != null ? item.getBrand().getNameKo() : null,
                                item.getCategory() != null ? item.getCategory().getId() : null,
                                item.getCategory() != null ? item.getCategory().getName() : null,
                                item.getKind(),
                                item.getRetailPrice(),
                                item.getRentalPrice(),
                                item.getItemMode(),
                                item.getViewCnt() != null ? item.getViewCnt() : 0,
                                item.getStatus(),
                                null,
                                mainImg,
                                Collections.emptyList(),
                                Collections.emptyList(),
                                optionValues,
                                ApiDateTimeConverter.toUtcString(item.getCreatedAt()));
        }

        private AdminItemDtos.ItemDetailResponse toAdminDetailResponse(
                        Item item,
                        List<ItemImage> images,
                        List<ItemFilter> itemFilters,
                        List<ItemOption> itemOptions) {
                String mainImg = images.stream()
                                .filter(img -> img.getImageType() == ItemImageType.MAIN)
                                .map(ItemImage::getImageUrl)
                                .findFirst()
                                .orElse(null);

                List<String> subImgs = images.stream()
                                .filter(img -> img.getImageType() == ItemImageType.SUB)
                                .map(ItemImage::getImageUrl)
                                .toList();

                List<AdminItemDtos.ItemTag> tags = itemFilters.stream()
                                .map(it -> new AdminItemDtos.ItemTag(it.getTag().getId(), it.getTag().getName()))
                                .toList();

                Map<String, Filter> filterByNormalizedName = filterRepository.findByUseYnTrueOrderBySortOrderAscIdAsc()
                                .stream()
                                .collect(Collectors.toMap(
                                                filter -> normalizeOptionKey(filter.getName()),
                                                filter -> filter,
                                                (first, ignored) -> first,
                                                LinkedHashMap::new));

                List<AdminItemDtos.ItemOptionValue> optionValues = itemOptions.stream()
                                .map(option -> new AdminItemDtos.ItemOptionValue(
                                                option.getId(),
                                                resolveOptionTagId(option, filterByNormalizedName),
                                                option.getOptionValue(),
                                                option.getQuantity(),
                                                option.getSortOrder()))
                                .toList();

                return new AdminItemDtos.ItemDetailResponse(
                                item.getId(),
                                item.getName(),
                                item.getBrand() != null ? item.getBrand().getId() : null,
                                item.getBrand() != null ? item.getBrand().getNameKo() : null,
                                item.getCategory() != null ? item.getCategory().getId() : null,
                                item.getCategory() != null ? item.getCategory().getName() : null,
                                item.getKind(),
                                item.getRetailPrice(),
                                item.getRentalPrice(),
                                item.getItemMode(),
                                item.getViewCnt() != null ? item.getViewCnt() : 0,
                                item.getStatus(),
                                htmlSanitizer.sanitizeRichText(item.getDetailContent()),
                                mainImg,
                                subImgs,
                                tags,
                                optionValues,
                                ApiDateTimeConverter.toUtcString(item.getCreatedAt()));
        }

        private Long resolveOptionTagId(ItemOption option, Map<String, Filter> filterByNormalizedName) {
                if (option.getSourceTag() != null && option.getSourceTag().getId() != null) {
                        return option.getSourceTag().getId();
                }

                String normalizedOptionValue = normalizeOptionKey(option.getOptionValue());
                if (normalizedOptionValue == null) {
                        return null;
                }

                Filter matchedFilter = filterByNormalizedName.get(normalizedOptionValue);
                return matchedFilter != null ? matchedFilter.getId() : null;
        }

        private String normalizeOptionKey(String value) {
                if (value == null) {
                        return null;
                }

                String normalized = value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
                if (normalized.isEmpty()) {
                        return null;
                }

                if (normalized.endsWith("mm")) {
                        normalized = normalized.substring(0, normalized.length() - 2);
                }

                return normalized;
        }

        private Pageable createPageable(int page, int size) {
                return PageRequest.of(Math.max(page, 0), size <= 0 ? 10 : size);
        }

        @Transactional(readOnly = true)
        public Map<String, Object> diagnoseFilterMatching(String categoryCode, List<Long> filterIds, String itemMode) {
                String normalizedCategoryCode = normalizeText(categoryCode);
                if (normalizedCategoryCode == null) {
                        throw new IllegalArgumentException("categoryCode는 필수입니다.");
                }

                String normalizedItemMode = normalizeText(itemMode);
                if (normalizedItemMode != null) {
                        normalizedItemMode = normalizedItemMode.toUpperCase(Locale.ROOT);
                }

                List<Long> normalizedFilterIds = normalizeFilterIds(filterIds);
                long totalCount = itemRepository.countActiveByCategoryCodeForDiagnose(normalizedCategoryCode,
                                normalizedItemMode);
                long noFilterMappingCount = itemRepository.countActiveByCategoryCodeWithoutFilterMappingForDiagnose(
                                normalizedCategoryCode,
                                normalizedItemMode);

                long anyMatchCount = 0L;
                long allMatchCount = 0L;
                long noneSelectedMatchCount = totalCount;

                if (!normalizedFilterIds.isEmpty()) {
                        anyMatchCount = itemRepository.countActiveByCategoryCodeWithAnyFilterIdsForDiagnose(
                                        normalizedCategoryCode,
                                        normalizedFilterIds,
                                        normalizedItemMode);
                        allMatchCount = itemRepository.countActiveByCategoryCodeWithAllFilterIdsForDiagnose(
                                        normalizedCategoryCode,
                                        normalizedFilterIds,
                                        normalizedFilterIds.size(),
                                        normalizedItemMode);
                        noneSelectedMatchCount = itemRepository
                                        .countActiveByCategoryCodeWithoutSelectedFilterIdsForDiagnose(
                                                        normalizedCategoryCode,
                                                        normalizedFilterIds,
                                                        normalizedItemMode);
                }

                List<Long> noFilterMappingSampleIds = itemRepository
                                .findActiveIdsByCategoryCodeWithoutFilterMappingForDiagnose(
                                                normalizedCategoryCode,
                                                normalizedItemMode,
                                                PageRequest.of(0, 20));

                double noFilterMappingRatio = totalCount == 0
                                ? 0D
                                : Math.round((noFilterMappingCount * 10000D) / totalCount) / 100D;

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("categoryCode", normalizedCategoryCode);
                result.put("itemMode", normalizedItemMode);
                result.put("selectedFilterIds", normalizedFilterIds);
                result.put("selectedFilterCount", normalizedFilterIds.size());
                result.put("totalCount", totalCount);
                result.put("anyMatchCount", anyMatchCount);
                result.put("allMatchCount", allMatchCount);
                result.put("noneSelectedMatchCount", noneSelectedMatchCount);
                result.put("noFilterMappingCount", noFilterMappingCount);
                result.put("noFilterMappingRatioPercent", noFilterMappingRatio);
                result.put("noFilterMappingSampleItemIds", noFilterMappingSampleIds);
                return result;
        }

        private String normalizeText(String value) {
                if (value == null) {
                        return null;
                }

                String normalized = value.trim();
                return normalized.isEmpty() ? null : normalized;
        }

        private List<Long> normalizeFilterIds(List<Long> filterIds) {
                if (filterIds == null || filterIds.isEmpty()) {
                        return List.of();
                }

                return filterIds.stream()
                                .filter(id -> id != null && id > 0)
                                .distinct()
                                .toList();
        }

        private <T> PageResponse<T> toPageResponse(List<T> content, Pageable pageable) {
                int total = content.size();
                int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / pageable.getPageSize());
                int from = Math.min((int) pageable.getOffset(), total);
                int to = Math.min(from + pageable.getPageSize(), total);

                return new PageResponse<>(
                                content.subList(from, to),
                                pageable.getPageNumber(),
                                pageable.getPageSize(),
                                total,
                                totalPages,
                                pageable.getPageNumber() == 0,
                                totalPages == 0 || pageable.getPageNumber() >= totalPages - 1);
        }

        private <T> PageResponse<T> toPageResponse(List<T> content, Page<?> page) {
                return new PageResponse<>(
                                content,
                                page.getNumber(),
                                page.getSize(),
                                page.getTotalElements(),
                                page.getTotalPages(),
                                page.isFirst(),
                                page.isLast());
        }
}
