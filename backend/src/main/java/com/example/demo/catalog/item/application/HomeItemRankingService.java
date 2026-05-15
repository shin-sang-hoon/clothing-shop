package com.example.demo.catalog.item.application;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemImage;
import com.example.demo.catalog.item.domain.ItemImageRepository;
import com.example.demo.catalog.item.domain.ItemImageType;
import com.example.demo.catalog.item.domain.ItemFilterRepository;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.catalog.item.domain.ItemViewLogRepository;
import com.example.demo.catalog.item.dto.ItemDtos;
import com.example.demo.catalog.search.domain.MemberFilterActionLogRepository;
import com.example.demo.catalog.search.domain.SearchKeywordLogRepository;
import com.example.demo.like.domain.ItemLike;
import com.example.demo.like.domain.ItemLikeRepository;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HomeItemRankingService {

    private static final Duration POPULAR_TTL = Duration.ofMinutes(5);
    private static final Duration RECOMMEND_TTL = Duration.ofMinutes(10);

    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final ItemFilterRepository itemFilterRepository;
    private final ItemViewLogRepository itemViewLogRepository;
    private final ItemLikeRepository itemLikeRepository;
    private final MemberFilterActionLogRepository memberFilterActionLogRepository;
    private final SearchKeywordLogRepository searchKeywordLogRepository;
    private final MemberRepository memberRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public record CachedItemList(List<ItemDtos.ItemListResponse> items, String cacheSource) {}

    @Transactional(readOnly = true)
    public CachedItemList getPopularItems(String itemMode, int size) {
        int normalizedSize = normalizeSize(size, 20, 200);
        String normalizedMode = normalizeItemMode(itemMode);
        String cacheKey = "home:popular:ids:" + modeToken(normalizedMode) + ":" + normalizedSize;

        List<Long> itemIds = getCachedIds(cacheKey);
        String cacheSource = "HIT";
        if (itemIds.isEmpty()) {
            log.info("[REDIS MISS] key={} -> rebuild popular ranking", cacheKey);
            cacheSource = "MISS";
            itemIds = itemRepository.findTopActiveByMode(
                            normalizedMode,
                            PageRequest.of(0, Math.max(normalizedSize, 200))
                    ).stream()
                    .map(Item::getId)
                    .limit(normalizedSize)
                    .toList();
            putCachedIds(cacheKey, itemIds, POPULAR_TTL);
        } else {
            log.info("[REDIS HIT] key={}", cacheKey);
        }

        return new CachedItemList(buildListResponse(itemIds), cacheSource);
    }

    @Transactional(readOnly = true)
    public CachedItemList getRecommendItems(
            String memberEmail,
            String itemMode,
            int size
    ) {
        int normalizedSize = normalizeSize(size, 10, 200);
        String normalizedMode = normalizeItemMode(itemMode);
        String memberToken = normalizeMemberToken(memberEmail);
        String cacheKey = "home:recommend:ids:" + memberToken + ":" + modeToken(normalizedMode) + ":" + normalizedSize;

        List<Long> itemIds = getCachedIds(cacheKey);
        String cacheSource = "HIT";
        if (itemIds.isEmpty()) {
            log.info("[REDIS MISS] key={} -> rebuild personalized recommend", cacheKey);
            cacheSource = "MISS";
            List<Item> candidates = itemRepository.findRecentActiveByMode(
                    normalizedMode,
                    PageRequest.of(0, Math.max(normalizedSize * 10, 300))
            );

            itemIds = rankRecommend(candidates, memberEmail, normalizedSize);
            putCachedIds(cacheKey, itemIds, RECOMMEND_TTL);
        } else {
            log.info("[REDIS HIT] key={}", cacheKey);
        }

        return new CachedItemList(buildListResponse(itemIds), cacheSource);
    }

    private List<Long> rankRecommend(List<Item> candidates, String memberEmail, int size) {
        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }

        if (memberEmail == null || memberEmail.isBlank()) {
            return candidates.stream()
                    .sorted(Comparator
                            .comparing((Item item) -> safeInt(item.getLikeCnt())).reversed()
                            .thenComparing((Item item) -> safeInt(item.getViewCnt()), Comparator.reverseOrder())
                            .thenComparing(Item::getId, Comparator.reverseOrder()))
                    .limit(size)
                    .map(Item::getId)
                    .toList();
        }

        String normalizedEmail = memberEmail.trim().toLowerCase(Locale.ROOT);
        Member member = memberRepository.findByEmail(normalizedEmail).orElse(null);
        if (member == null) {
            return candidates.stream()
                    .limit(size)
                    .map(Item::getId)
                    .toList();
        }

        List<ItemLike> likes = itemLikeRepository.findByMemberIdWithItem(member.getId());
        List<Long> recentViewedIds = itemViewLogRepository.findRecentViewedItemIdsByMemberEmail(
                normalizedEmail,
                PageRequest.of(0, 120)
        );
        List<String> recentKeywords = searchKeywordLogRepository.findRecentNormalizedKeywordsByMemberEmail(
                normalizedEmail,
                PageRequest.of(0, 30)
        );
        List<MemberFilterActionLogRepository.FilterUsageCount> recentFilterUsages =
                memberFilterActionLogRepository.findRecentFilterUsageByMemberEmail(
                        normalizedEmail,
                        com.example.demo.global.time.ApiDateTimeConverter.nowKst().minusDays(30),
                        PageRequest.of(0, 30)
                );

        Map<Long, Item> viewedItemMap = itemRepository.findByIdInWithBrandAndCategory(recentViewedIds).stream()
                .collect(Collectors.toMap(Item::getId, item -> item, (a, b) -> a));
        Map<Long, List<Long>> itemFilterMap = itemFilterRepository
                .findByItemIdInWithTag(candidates.stream().map(Item::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(
                        row -> row.getItem().getId(),
                        Collectors.mapping(row -> row.getTag().getId(), Collectors.toList())
                ));
        Map<Long, Integer> brandWeight = new LinkedHashMap<>();
        Map<Long, Integer> categoryWeight = new LinkedHashMap<>();
        Map<Long, Integer> preferredFilterWeight = new LinkedHashMap<>();
        Set<Long> likedSet = likes.stream()
                .map(like -> like.getItem().getId())
                .collect(Collectors.toSet());
        Set<Long> viewedSet = Set.copyOf(recentViewedIds);

        for (ItemLike like : likes) {
            Item likedItem = like.getItem();
            if (likedItem == null) {
                continue;
            }
            if (likedItem.getBrand() != null && likedItem.getBrand().getId() != null) {
                brandWeight.merge(likedItem.getBrand().getId(), 3, Integer::sum);
            }
            if (likedItem.getCategory() != null && likedItem.getCategory().getId() != null) {
                categoryWeight.merge(likedItem.getCategory().getId(), 3, Integer::sum);
            }
        }

        for (Long viewedId : recentViewedIds) {
            Item viewed = viewedItemMap.get(viewedId);
            if (viewed == null) {
                continue;
            }
            if (viewed.getBrand() != null && viewed.getBrand().getId() != null) {
                brandWeight.merge(viewed.getBrand().getId(), 1, Integer::sum);
            }
            if (viewed.getCategory() != null && viewed.getCategory().getId() != null) {
                categoryWeight.merge(viewed.getCategory().getId(), 1, Integer::sum);
            }
        }

        List<String> dedupKeywords = recentKeywords.stream()
                .filter(keyword -> keyword != null && !keyword.isBlank())
                .distinct()
                .toList();
        for (MemberFilterActionLogRepository.FilterUsageCount usage : recentFilterUsages) {
            if (usage.getFilterId() == null || usage.getActionCount() == null) {
                continue;
            }
            preferredFilterWeight.put(usage.getFilterId(), usage.getActionCount().intValue());
        }

        return candidates.stream()
                .sorted((a, b) -> Double.compare(
                        scoreRecommend(
                                b,
                                brandWeight,
                                categoryWeight,
                                preferredFilterWeight,
                                itemFilterMap,
                                viewedSet,
                                likedSet,
                                dedupKeywords
                        ),
                        scoreRecommend(
                                a,
                                brandWeight,
                                categoryWeight,
                                preferredFilterWeight,
                                itemFilterMap,
                                viewedSet,
                                likedSet,
                                dedupKeywords
                        )
                ))
                .limit(size)
                .map(Item::getId)
                .toList();
    }

    private double scoreRecommend(
            Item item,
            Map<Long, Integer> brandWeight,
            Map<Long, Integer> categoryWeight,
            Map<Long, Integer> preferredFilterWeight,
            Map<Long, List<Long>> itemFilterMap,
            Set<Long> viewedSet,
            Set<Long> likedSet,
            List<String> searchKeywords
    ) {
        double score = 0D;

        Long brandId = item.getBrand() != null ? item.getBrand().getId() : null;
        Long categoryId = item.getCategory() != null ? item.getCategory().getId() : null;

        score += brandId == null ? 0D : brandWeight.getOrDefault(brandId, 0) * 10D;
        score += categoryId == null ? 0D : categoryWeight.getOrDefault(categoryId, 0) * 6D;
        score += matchPreferredFilterScore(item.getId(), itemFilterMap, preferredFilterWeight) * 9D;
        score += matchKeywordScore(item, searchKeywords) * 8D;
        score += safeInt(item.getLikeCnt()) * 0.5D;
        score += safeInt(item.getViewCnt()) * 0.2D;
        score += (item.getId() != null ? item.getId() : 0L) * 0.0001D;

        if (item.getId() != null && likedSet.contains(item.getId())) {
            score -= 300D;
        }
        if (item.getId() != null && viewedSet.contains(item.getId())) {
            score -= 120D;
        }
        return score;
    }

    private int matchPreferredFilterScore(
            Long itemId,
            Map<Long, List<Long>> itemFilterMap,
            Map<Long, Integer> preferredFilterWeight
    ) {
        if (itemId == null || itemFilterMap == null || preferredFilterWeight == null || preferredFilterWeight.isEmpty()) {
            return 0;
        }

        List<Long> filterIds = itemFilterMap.getOrDefault(itemId, List.of());
        if (filterIds.isEmpty()) {
            return 0;
        }

        int score = 0;
        for (Long filterId : filterIds) {
            score += preferredFilterWeight.getOrDefault(filterId, 0);
        }
        return score;
    }

    private int matchKeywordScore(Item item, List<String> searchKeywords) {
        if (searchKeywords == null || searchKeywords.isEmpty()) {
            return 0;
        }

        String itemName = item.getName() != null ? item.getName().toLowerCase(Locale.ROOT) : "";
        String brandName = item.getBrand() != null && item.getBrand().getNameKo() != null
                ? item.getBrand().getNameKo().toLowerCase(Locale.ROOT)
                : "";
        String kind = item.getKind() != null ? item.getKind().toLowerCase(Locale.ROOT) : "";
        String categoryName = item.getCategory() != null && item.getCategory().getName() != null
                ? item.getCategory().getName().toLowerCase(Locale.ROOT)
                : "";

        int matched = 0;
        for (String keyword : searchKeywords) {
            String token = keyword.trim().toLowerCase(Locale.ROOT);
            if (token.isBlank()) {
                continue;
            }
            if (itemName.contains(token) || brandName.contains(token) || kind.contains(token) || categoryName.contains(token)) {
                matched++;
            }
        }
        return matched;
    }

    private List<ItemDtos.ItemListResponse> buildListResponse(List<Long> itemIds) {
        if (itemIds == null || itemIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Item> items = itemRepository.findByIdInWithBrandAndCategory(itemIds);
        if (items.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Integer> orderMap = new LinkedHashMap<>();
        for (int i = 0; i < itemIds.size(); i++) {
            orderMap.put(itemIds.get(i), i);
        }

        List<Long> ids = items.stream().map(Item::getId).toList();
        Map<Long, String> mainImageMap = itemImageRepository
                .findByItemIdInAndImageTypeOrderByItemIdAscSortOrderAsc(ids, ItemImageType.MAIN)
                .stream()
                .collect(Collectors.toMap(
                        img -> img.getItem().getId(),
                        ItemImage::getImageUrl,
                        (a, b) -> a
                ));

        return items.stream()
                .sorted(Comparator.comparingInt(item -> orderMap.getOrDefault(item.getId(), Integer.MAX_VALUE)))
                .map(item -> new ItemDtos.ItemListResponse(
                        item.getId(),
                        item.getItemNo(),
                        item.getName(),
                        item.getBrand() != null ? item.getBrand().getId() : null,
                        item.getBrand() != null ? item.getBrand().getCode() : null,
                        item.getBrand() != null ? item.getBrand().getNameKo() : null,
                        item.getCategory() != null ? item.getCategory().getId() : null,
                        item.getCategory() != null ? item.getCategory().getCode() : null,
                        item.getCategory() != null ? item.getCategory().getName() : null,
                        item.getKind(),
                        item.getRetailPrice(),
                        item.getRentalPrice(),
                        item.getItemMode(),
                        safeInt(item.getLikeCnt()),
                        safeInt(item.getViewCnt()),
                        item.getStatus(),
                        mainImageMap.get(item.getId()),
                        List.of()
                ))
                .toList();
    }

    private int normalizeSize(int requestedSize, int defaultSize, int maxSize) {
        if (requestedSize <= 0) {
            return defaultSize;
        }
        return Math.min(requestedSize, maxSize);
    }

    private String normalizeItemMode(String itemMode) {
        if (itemMode == null || itemMode.isBlank()) {
            return null;
        }
        return itemMode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeMemberToken(String memberEmail) {
        if (memberEmail == null || memberEmail.isBlank()) {
            return "anonymous";
        }
        return memberEmail.trim().toLowerCase(Locale.ROOT);
    }

    private String modeToken(String itemMode) {
        return itemMode == null ? "all" : itemMode;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private void putCachedIds(String key, List<Long> ids, Duration ttl) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        redisTemplate.opsForValue().set(
                key,
                ids.stream().map(String::valueOf).collect(Collectors.joining(",")),
                ttl
        );
    }

    private List<Long> getCachedIds(String key) {
        Object raw = redisTemplate.opsForValue().get(key);
        if (!(raw instanceof String value) || value.isBlank()) {
            return Collections.emptyList();
        }
        String[] tokens = value.split(",");
        List<Long> ids = new ArrayList<>(tokens.length);
        for (String token : tokens) {
            try {
                ids.add(Long.parseLong(token.trim()));
            } catch (NumberFormatException ignored) {
                // skip malformed id
            }
        }
        return ids;
    }
}
