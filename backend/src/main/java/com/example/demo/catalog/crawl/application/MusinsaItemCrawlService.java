package com.example.demo.catalog.crawl.application;

import com.example.demo.catalog.brand.domain.Brand;
import com.example.demo.catalog.brand.domain.BrandRepository;
import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryRepository;
import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.item.application.ItemFilterTagSyncService;
import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemFilter;
import com.example.demo.catalog.item.domain.ItemFilterRepository;
import com.example.demo.catalog.item.domain.ItemImage;
import com.example.demo.catalog.item.domain.ItemImageRepository;
import com.example.demo.catalog.item.domain.ItemImageType;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.catalog.item.domain.ItemTag;
import com.example.demo.catalog.item.domain.ItemTagRepository;
import com.example.demo.catalog.tag.domain.Tag;
import com.example.demo.catalog.tag.domain.TagRepository;
import com.example.demo.global.security.HtmlSanitizer;
import com.example.demo.trade.domain.ItemOption;
import com.example.demo.trade.domain.ItemOptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class MusinsaItemCrawlService {

    private static final int TARGET_IMPORT_COUNT = 30;
    private static final int MAX_PAGES = 100;
    private static final int CRAWL_IMPORT_WORKER_COUNT = 4;

    private static final Path OFFSET_FILE = Path.of("crawl-offsets.json");
    private static final java.util.Map<String, Integer> categoryPageOffsets = loadOffsets();

    private static java.util.Map<String, Integer> loadOffsets() {
        java.util.Map<String, Integer> map = new java.util.concurrent.ConcurrentHashMap<>();
        if (Files.exists(OFFSET_FILE)) {
            try {
                String json = Files.readString(OFFSET_FILE);
                // 간단한 파싱: {"105":551,"other":1} 형태
                json = json.trim().replaceAll("[{}]", "");
                for (String entry : json.split(",")) {
                    String[] kv = entry.trim().split(":");
                    if (kv.length == 2) {
                        String key = kv[0].trim().replaceAll("\"", "");
                        int val = Integer.parseInt(kv[1].trim());
                        map.put(key, val);
                    }
                }
            } catch (Exception e) {
                // 파일 파싱 실패 시 빈 맵으로 시작
            }
        }
        return map;
    }

    private static void saveOffsets() {
        try {
            StringBuilder sb = new StringBuilder("{");
            categoryPageOffsets.forEach((k, v) -> sb.append("\"").append(k).append("\":").append(v).append(","));
            if (sb.charAt(sb.length() - 1) == ',') sb.deleteCharAt(sb.length() - 1);
            sb.append("}");
            Files.writeString(OFFSET_FILE, sb.toString());
        } catch (IOException e) {
            // 저장 실패 시 무시 (다음에 다시 시도)
        }
    }

    private final MusinsaCrawlerExecutor musinsaCrawlerExecutor;
    private final ItemCrawlImageStorageService itemCrawlImageStorageService;
    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final ItemTagRepository itemTagRepository;
    private final ItemFilterRepository itemFilterRepository;
    private final TagRepository tagRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ItemOptionRepository itemOptionRepository;
    private final FilterRepository filterRepository;
    private final ItemFilterTagSyncService itemFilterTagSyncService;
    private final HtmlSanitizer htmlSanitizer;
    private final PlatformTransactionManager transactionManager;
    private final Map<String, Optional<Brand>> brandLookupCache = new ConcurrentHashMap<>();
    private final Map<String, Optional<Category>> categoryCodeLookupCache = new ConcurrentHashMap<>();
    private final Map<String, Optional<Category>> categoryDepth2NameLookupCache = new ConcurrentHashMap<>();
    private final Map<String, Optional<Filter>> genderFilterLookupCache = new ConcurrentHashMap<>();
    private final AtomicInteger nextTagSortOrderSeed = new AtomicInteger(-1);

    public CatalogCrawlDtos.ItemImportResult importItems(String categoryCode) {
        int importedCount = 0;
        int skippedCount = 0;
        int failedCount = 0;
        int listedCount = 0;
        String source = "musinsa";

        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        if (nextTagSortOrderSeed.get() < 0) {
            nextTagSortOrderSeed.compareAndSet(-1, Math.toIntExact(tagRepository.count()));
        }

        // DB에 이미 30개 이상 있는 카테고리는 스킵 (다음 카테고리로)
        long existingCount = itemRepository.countByCategory_Code(categoryCode);
        if (existingCount >= TARGET_IMPORT_COUNT) {
            log.info("카테고리 이미 {}개 보유, 스킵. categoryCode={}", existingCount, categoryCode);
            return new CatalogCrawlDtos.ItemImportResult(source, categoryCode, 0, 0, (int) existingCount, 0);
        }

        int startPage = categoryPageOffsets.getOrDefault(categoryCode, 1);
        log.info("카테고리 크롤링 시작. categoryCode={}, startPage={}, existing={}", categoryCode, startPage, existingCount);

        int catalogTotalCount = 0;
        ExecutorService importExecutor = Executors.newFixedThreadPool(CRAWL_IMPORT_WORKER_COUNT);
        for (int page = startPage; page < startPage + MAX_PAGES && importedCount < TARGET_IMPORT_COUNT; page++) {
            // 1단계: 목록만 빠르게 조회 (상세 fetch 없음, ~0.5초/페이지)
            CatalogCrawlDtos.CrawlResponse listResponse = musinsaCrawlerExecutor.execute("itemlist", categoryCode, page);
            List<CatalogCrawlDtos.CrawlItemItem> listItems = listResponse.items() != null ? listResponse.items() : List.of();
            listedCount += listItems.size();

            // 첫 페이지에서 전체 상품 수 확인
            if (catalogTotalCount == 0 && listResponse.catalogTotalCount() > 0) {
                catalogTotalCount = listResponse.catalogTotalCount();
                log.info("카탈로그 전체 상품 수 확인. categoryCode={}, totalCount={}", categoryCode, catalogTotalCount);
            }

            // 전체 상품 수를 초과하면 종료
            if (catalogTotalCount > 0 && (page - 1) * 30 >= catalogTotalCount) {
                log.info("카탈로그 전체 범위 초과. categoryCode={}, page={}, totalCount={}. 오프셋 초기화.",
                        categoryCode, page, catalogTotalCount);
                categoryPageOffsets.put(categoryCode, 1);
                saveOffsets();
                break;
            }

            if (listItems.isEmpty()) {
                break;
            }

            // DB에 없는 신규 상품만 상세 크롤링 후 import
            List<String> newItemNos = listItems.stream()
                    .map(item -> normalizeText(item.goodsNo()))
                    .filter(no -> no != null)
                    .distinct()
                    .toList();
            Set<String> existingItemNos = findExistingItemNos(newItemNos);
            Set<String> pageNewItemNoSet = newItemNos.stream()
                    .filter(no -> !existingItemNos.contains(no))
                    .collect(java.util.stream.Collectors.toSet());

            if (pageNewItemNoSet.isEmpty()) {
                skippedCount += listItems.size();
                log.info("신규 상품 없음. categoryCode={}, page={}", categoryCode, page);
                continue;
            }

            log.info("신규 상품 발견. categoryCode={}, page={}, newCount={}. 상세 크롤링 시작.", categoryCode, page, pageNewItemNoSet.size());
            CatalogCrawlDtos.CrawlResponse fullResponse = musinsaCrawlerExecutor.execute("item", categoryCode, page);
            List<CatalogCrawlDtos.CrawlItemItem> items = fullResponse.items() != null ? fullResponse.items() : List.of();
            source = fullResponse.source();
            List<CatalogCrawlDtos.CrawlItemItem> candidates = new ArrayList<>();
            Set<String> candidateItemNos = new LinkedHashSet<>();
            for (CatalogCrawlDtos.CrawlItemItem crawledItem : items) {
                String itemNo = normalizeText(crawledItem.goodsNo());
                if (itemNo == null) {
                    failedCount++;
                    continue;
                }
                if (!pageNewItemNoSet.contains(itemNo) || !candidateItemNos.add(itemNo)) {
                    skippedCount++;
                    continue;
                }
                candidates.add(crawledItem);
            }

            int remainingCapacity = TARGET_IMPORT_COUNT - importedCount;
            if (remainingCapacity <= 0) {
                break;
            }
            if (candidates.size() > remainingCapacity) {
                skippedCount += candidates.size() - remainingCapacity;
                candidates = candidates.subList(0, remainingCapacity);
            }

            List<Future<Boolean>> futures = new ArrayList<>();
            for (CatalogCrawlDtos.CrawlItemItem crawledItem : candidates) {
                String itemNo = normalizeText(crawledItem.goodsNo());
                if (itemNo == null) {
                    failedCount++;
                    continue;
                }
                String finalCategoryCode = categoryCode;
                String finalItemNo = itemNo;
                futures.add(importExecutor.submit(() -> {
                    try {
                        transactionTemplate.executeWithoutResult(
                                status -> importSingleItem(crawledItem, finalItemNo, finalCategoryCode)
                        );
                        return true;
                    } catch (Exception exception) {
                        log.warn("?곹뭹 ?щ·留?import ?ㅽ뙣. goodsNo={}, goodsName={}",
                                crawledItem.goodsNo(), crawledItem.goodsName(), exception);
                        return false;
                    }
                }));
            }

            for (Future<Boolean> future : futures) {
                try {
                    if (future.get()) {
                        importedCount++;
                    } else {
                        failedCount++;
                    }
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    failedCount++;
                } catch (Exception exception) {
                    failedCount++;
                }
            }
        }

        // 전부 스킵이면 다음 오프셋으로 이동
        importExecutor.shutdown();
        try {
            if (!importExecutor.awaitTermination(30, TimeUnit.SECONDS)) {
                importExecutor.shutdownNow();
            }
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            importExecutor.shutdownNow();
        }

        if (importedCount == 0 && failedCount == 0 && skippedCount > 0) {
            int nextPage = startPage + MAX_PAGES;
            categoryPageOffsets.put(categoryCode, nextPage);
            saveOffsets();
            log.info("전체 스킵. 다음 크롤링 오프셋 업데이트. categoryCode={}, nextStartPage={}", categoryCode, nextPage);
        }

        log.info("아이템 크롤링 완료. categoryCode={}, listed={}, imported={}, skipped={}, failed={}",
                categoryCode, listedCount, importedCount, skippedCount, failedCount);

        return new CatalogCrawlDtos.ItemImportResult(
                source,
                categoryCode,
                listedCount,
                importedCount,
                skippedCount,
                failedCount
        );
    }

    private void importSingleItem(CatalogCrawlDtos.CrawlItemItem crawledItem, String itemNo, String fallbackCategoryCode) {
        Category category = resolveCategory(crawledItem, fallbackCategoryCode);
        Brand brand = resolveBrand(crawledItem);

        Item item = new Item();
        item.setItemNo(itemNo);
        item.setName(defaultText(crawledItem.goodsName(), itemNo));
        item.setBrand(brand);
        item.setCategory(category);
        item.setKind(normalizeText(crawledItem.categoryDepth1Name()));
        item.setRetailPrice(resolveRetailPrice(crawledItem));
        item.setRentalPrice(null);
        item.setStatus(Boolean.TRUE.equals(crawledItem.soldOut()) ? "품절" : "판매중");
        item.setDetailContent(htmlSanitizer.sanitizeRichText(crawledItem.goodsContents()));
        item.setUseYn(true);
        item.setSortOrder(0);

        Item savedItem = itemRepository.save(item);

        saveImages(savedItem, crawledItem);
        try {
            savedItem.setDetailContent(
                    htmlSanitizer.sanitizeRichText(
                            itemCrawlImageStorageService.replaceContentImageUrls(
                                    savedItem.getId(),
                                    crawledItem.goodsContents()
                            )
                    )
            );
        } catch (Exception exception) {
            throw new IllegalStateException("상세 컨텐츠 이미지 치환 실패. itemNo=" + itemNo, exception);
        }

        saveTags(savedItem, crawledItem.tags());
        saveOptions(savedItem, crawledItem.optionValues());
        saveDisplayGenderFilter(savedItem, crawledItem.displayGenderText());
        itemFilterTagSyncService.syncForItem(savedItem, null, null);
    }

    private void updateItemCategory(Item item, CatalogCrawlDtos.CrawlItemItem crawledItem, String boutiqueCode) {
        Category boutiqueCategory = categoryRepository.findByCode(boutiqueCode).orElse(null);
        if (boutiqueCategory == null) {
            log.warn("부티크 카테고리를 찾을 수 없음. code={}", boutiqueCode);
            return;
        }
        item.setCategory(boutiqueCategory);
        itemRepository.save(item);
        log.info("부티크 카테고리 업데이트. itemNo={}, category={}", item.getItemNo(), boutiqueCode);
    }

    private void saveImages(Item item, CatalogCrawlDtos.CrawlItemItem crawledItem) {
        String thumbnailUrl;
        try {
            thumbnailUrl = itemCrawlImageStorageService.storeThumbnailImage(item.getId(), crawledItem.thumbnailImageUrl());
        } catch (Exception exception) {
            throw new IllegalStateException("썸네일 저장 실패. itemNo=" + item.getItemNo(), exception);
        }

        if (thumbnailUrl != null) {
            ItemImage mainImage = new ItemImage();
            mainImage.setItem(item);
            mainImage.setImageType(ItemImageType.MAIN);
            mainImage.setImageUrl(thumbnailUrl);
            mainImage.setSortOrder(0);
            itemImageRepository.save(mainImage);
        }

        List<String> detailImages = crawledItem.goodsImageUrls() != null ? crawledItem.goodsImageUrls() : List.of();
        Set<String> dedupedImageUrls = new LinkedHashSet<>(detailImages);
        int sortOrder = 0;
        for (String imageUrl : dedupedImageUrls) {
            String storedUrl;
            try {
                storedUrl = itemCrawlImageStorageService.storeThumbnailImage(item.getId(), imageUrl);
            } catch (Exception exception) {
                throw new IllegalStateException("서브 이미지 저장 실패. itemNo=" + item.getItemNo(), exception);
            }

            if (storedUrl == null) {
                continue;
            }

            ItemImage subImage = new ItemImage();
            subImage.setItem(item);
            subImage.setImageType(ItemImageType.SUB);
            subImage.setImageUrl(storedUrl);
            subImage.setSortOrder(sortOrder++);
            itemImageRepository.save(subImage);
        }
    }

    private void saveTags(Item item, List<String> rawTagNames) {
        if (rawTagNames == null || rawTagNames.isEmpty()) {
            return;
        }

        Set<String> savedKeys = new LinkedHashSet<>();
        for (String rawTagName : rawTagNames) {
            String tagName = normalizeText(rawTagName);
            String normalizedKey = normalizeTagKey(tagName);
            if (tagName == null || normalizedKey == null || !savedKeys.add(normalizedKey)) {
                continue;
            }

            Tag tag = findOrCreateTag(tagName, nextTagSortOrderSeed.getAndIncrement());

            ItemTag itemTag = new ItemTag();
            itemTag.setItem(item);
            itemTag.setTag(tag);
            itemTagRepository.save(itemTag);
        }
    }

    private void saveOptions(Item item, List<CatalogCrawlDtos.CrawlItemOptionValue> optionValues) {
        if (optionValues == null || optionValues.isEmpty()) {
            return;
        }

        Set<String> savedKeys = new LinkedHashSet<>();
        int sortOrder = 0;

        for (CatalogCrawlDtos.CrawlItemOptionValue optionValue : optionValues) {
            if (optionValue == null) {
                continue;
            }

            String rawValue = normalizeText(optionValue.value());
            String normalizedKey = normalizeOptionKey(rawValue);
            if (rawValue == null || normalizedKey == null || !savedKeys.add(normalizedKey)) {
                continue;
            }

            ItemOption itemOption = new ItemOption();
            itemOption.setItem(item);
            itemOption.setSourceTag(null);
            itemOption.setOptionValue(rawValue);
            itemOption.setQuantity(1);
            itemOption.setSortOrder(sortOrder++);
            itemOptionRepository.save(itemOption);
        }
    }

    private void saveDisplayGenderFilter(Item item, String displayGenderText) {
        String genderFilterCode = resolveGenderFilterCode(displayGenderText);
        if (genderFilterCode == null) {
            return;
        }

        Optional<Filter> filter = genderFilterLookupCache.computeIfAbsent(
                genderFilterCode,
                filterRepository::findByCode
        );
        if (filter.isEmpty()) {
            log.info("성별 필터를 찾지 못해 스킵합니다. code={}, itemNo={}", genderFilterCode, item.getItemNo());
            return;
        }

        ItemFilter itemFilter = new ItemFilter();
        itemFilter.setItem(item);
        itemFilter.setTag(filter.get());
        itemFilterRepository.save(itemFilter);
    }

    private String resolveGenderFilterCode(String displayGenderText) {
        String normalized = normalizeText(displayGenderText);
        if (normalized == null) {
            return null;
        }

        String key = normalized.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        if (key.contains("공용") || key.contains("전체") || key.contains("unisex") || key.contains("all")) {
            return "GF_GF_A";
        }
        if (key.contains("여") || key.contains("women") || key.contains("woman") || key.contains("female")) {
            return "GF_GF_F";
        }
        if (key.contains("남") || key.contains("men") || key.contains("male")) {
            return "GF_GF_M";
        }
        return null;
    }

    private Tag findOrCreateTag(String tagName, int sortOrder) {
        // intern()으로 동일 태그명에 대해 JVM 내 단일 lock 객체 사용 → 동시 삽입 방지
        String lockKey = ("TAG_LOCK_" + tagName.toLowerCase(Locale.ROOT)).intern();
        synchronized (lockKey) {
            Optional<Tag> existingTag = tagRepository.findFirstByNameIgnoreCase(tagName);
            if (existingTag.isPresent()) {
                return existingTag.get();
            }

            Tag tag = new Tag();
            tag.setName(tagName);
            tag.setCode(generateUniqueTagCode(tagName));
            tag.setUseYn(true);
            tag.setSortOrder(sortOrder);
            return tagRepository.save(tag);
        }
    }

    private String generateUniqueTagCode(String tagName) {
        String base = "TAG_" + normalizeTagKey(tagName).toUpperCase(Locale.ROOT);
        String candidate = base;
        int suffix = 1;
        while (tagRepository.existsByCode(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }

    private Brand resolveBrand(CatalogCrawlDtos.CrawlItemItem crawledItem) {
        String normalizedBrandName = normalizeText(crawledItem.brandName());
        if (normalizedBrandName == null) {
            return null;
        }
        String lowerName = normalizedBrandName.toLowerCase(Locale.ROOT);
        return brandLookupCache.computeIfAbsent(
                lowerName,
                key -> brandRepository.findByNameKoLower(key).stream().findFirst()
                        .or(() -> brandRepository.findByNameEnLower(key).stream().findFirst())
        ).orElse(null);
    }

    private Category resolveCategory(CatalogCrawlDtos.CrawlItemItem crawledItem, String fallbackCategoryCode) {
        // 부티크 크롤링은 카테고리를 105(부티크)로 고정
        if ("105".equals(fallbackCategoryCode)) {
            return categoryCodeLookupCache.computeIfAbsent("105", categoryRepository::findByCode).orElse(null);
        }
        String categoryCode = normalizeText(crawledItem.categoryDepth2Code());
        if (categoryCode != null) {
            Optional<Category> matchedByCode = categoryCodeLookupCache.computeIfAbsent(
                    categoryCode,
                    categoryRepository::findByCode
            );
            if (matchedByCode.isPresent()) {
                return matchedByCode.get();
            }

            String depth2Code = normalizeDepth2CategoryCode(categoryCode);
            if (depth2Code != null) {
                Optional<Category> matchedByDepth2Code = categoryCodeLookupCache.computeIfAbsent(
                        depth2Code,
                        categoryRepository::findByCode
                );
                if (matchedByDepth2Code.isPresent()) {
                    return matchedByDepth2Code.get();
                }
            }
        }

        String categoryName = normalizeText(crawledItem.categoryDepth2Name());
        if (categoryName != null) {
            Optional<Category> matchedByDepth2Name = categoryDepth2NameLookupCache.computeIfAbsent(
                    categoryName.toLowerCase(Locale.ROOT),
                    key -> {
                        List<Category> candidates = categoryRepository.findAllByDepthAndNameIgnoreCase(2, categoryName);
                        if (candidates.isEmpty()) {
                            return Optional.empty();
                        }
                        candidates.sort((left, right) -> {
                            if (left.isUseYn() != right.isUseYn()) {
                                return left.isUseYn() ? -1 : 1;
                            }
                            int sortCompare = Integer.compare(
                                    left.getSortOrder() != null ? left.getSortOrder() : Integer.MAX_VALUE,
                                    right.getSortOrder() != null ? right.getSortOrder() : Integer.MAX_VALUE
                            );
                            if (sortCompare != 0) {
                                return sortCompare;
                            }
                            return Long.compare(
                                    left.getId() != null ? left.getId() : Long.MAX_VALUE,
                                    right.getId() != null ? right.getId() : Long.MAX_VALUE
                            );
                        });
                        return Optional.of(candidates.get(0));
                    }
            );
            if (matchedByDepth2Name.isPresent()) {
                return matchedByDepth2Name.get();
            }
        }

        if (fallbackCategoryCode != null) {
            Optional<Category> fallback = categoryCodeLookupCache.computeIfAbsent(
                    fallbackCategoryCode,
                    categoryRepository::findByCode
            );
            if (fallback.isPresent()) {
                log.info("카테고리 매핑 실패, fallback 적용. goodsNo={}, depth2Code={}, depth2Name={}, fallback={}",
                        crawledItem.goodsNo(), categoryCode, categoryName, fallbackCategoryCode);
                return fallback.get();
            }
        }

        throw new IllegalArgumentException(
                "매핑되는 카테고리가 없습니다. goodsNo=" + crawledItem.goodsNo()
                        + ", categoryCode=" + categoryCode
                        + ", categoryName=" + categoryName
        );
    }

    private Integer resolveRetailPrice(CatalogCrawlDtos.CrawlItemItem crawledItem) {
        if (crawledItem.normalPrice() != null && crawledItem.normalPrice() > 0) {
            return crawledItem.normalPrice();
        }
        return crawledItem.salePrice();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeTagKey(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        return normalized.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    private String normalizeOptionKey(String value) {
        String normalized = normalizeTagKey(value);
        if (normalized == null) {
            return null;
        }
        if (normalized.endsWith("mm")) {
            return normalized.substring(0, normalized.length() - 2);
        }
        return normalized;
    }

    private String defaultText(String value, String fallback) {
        return Optional.ofNullable(normalizeText(value)).orElse(fallback);
    }

    private Set<String> findExistingItemNos(List<String> itemNos) {
        if (itemNos == null || itemNos.isEmpty()) {
            return Set.of();
        }
        return new LinkedHashSet<>(itemRepository.findItemNosIn(itemNos));
    }

    private String normalizeDepth2CategoryCode(String rawCode) {
        String normalized = normalizeText(rawCode);
        if (normalized == null) {
            return null;
        }
        String digitsOnly = normalized.replaceAll("[^0-9]", "");
        if (digitsOnly.length() < 6) {
            return null;
        }
        return digitsOnly.substring(0, 6);
    }
}
