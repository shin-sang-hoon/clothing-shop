package com.example.demo.like.application;

import com.example.demo.catalog.brand.domain.Brand;
import com.example.demo.catalog.brand.domain.BrandRepository;
import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemImageRepository;
import com.example.demo.catalog.item.domain.ItemImageType;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.like.domain.BrandLike;
import com.example.demo.like.domain.BrandLikeRepository;
import com.example.demo.like.domain.ItemLike;
import com.example.demo.like.domain.ItemLikeRepository;
import com.example.demo.like.dto.LikeDtos;
import com.example.demo.member.application.MemberStatusService;
import com.example.demo.member.domain.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final BrandRepository brandRepository;
    private final ItemLikeRepository itemLikeRepository;
    private final BrandLikeRepository brandLikeRepository;
    private final MemberStatusService memberStatusService;

    @Transactional
    public LikeDtos.LikeToggleResponse likeItem(String email, Long itemId) {
        Member member = findMember(email);
        Item item = findItem(itemId);

        if (!itemLikeRepository.existsByMemberIdAndItemId(member.getId(), itemId)) {
            itemLikeRepository.save(new ItemLike(member, item));
            refreshItemLikeCnt(item);
        }

        return new LikeDtos.LikeToggleResponse(true, item.getLikeCnt());
    }

    @Transactional
    public LikeDtos.LikeToggleResponse unlikeItem(String email, Long itemId) {
        Member member = findMember(email);
        Item item = findItem(itemId);

        itemLikeRepository.deleteByMemberIdAndItemId(member.getId(), itemId);
        refreshItemLikeCnt(item);

        return new LikeDtos.LikeToggleResponse(false, item.getLikeCnt());
    }

    @Transactional(readOnly = true)
    public boolean isItemLiked(String email, Long itemId) {
        Member member = findMember(email);
        return itemLikeRepository.existsByMemberIdAndItemId(member.getId(), itemId);
    }

    @Transactional(readOnly = true)
    public List<LikeDtos.LikedItemResponse> getMyLikedItems(String email) {
        Member member = findMember(email);
        return itemLikeRepository.findByMemberIdWithItem(member.getId()).stream()
                .map(this::toLikedItemResponse)
                .toList();
    }

    @Transactional
    public LikeDtos.LikeToggleResponse likeBrand(String email, Long brandId) {
        Member member = findMember(email);
        Brand brand = findBrand(brandId);

        if (!brandLikeRepository.existsByMemberIdAndBrandId(member.getId(), brandId)) {
            brandLikeRepository.save(new BrandLike(member, brand));
            refreshBrandLikeCnt(brand);
        }

        return new LikeDtos.LikeToggleResponse(true, getTotalBrandLikeCnt(brand));
    }

    @Transactional
    public LikeDtos.LikeToggleResponse unlikeBrand(String email, Long brandId) {
        Member member = findMember(email);
        Brand brand = findBrand(brandId);

        brandLikeRepository.deleteByMemberIdAndBrandId(member.getId(), brandId);
        refreshBrandLikeCnt(brand);

        return new LikeDtos.LikeToggleResponse(false, getTotalBrandLikeCnt(brand));
    }

    @Transactional(readOnly = true)
    public LikeDtos.LikeToggleResponse getBrandLikeStatus(String email, Long brandId) {
        Member member = findMember(email);
        Brand brand = findBrand(brandId);
        boolean liked = brandLikeRepository.existsByMemberIdAndBrandId(member.getId(), brandId);
        return new LikeDtos.LikeToggleResponse(liked, getTotalBrandLikeCnt(brand));
    }

    @Transactional(readOnly = true)
    public List<LikeDtos.LikedBrandResponse> getMyLikedBrands(String email) {
        Member member = findMember(email);
        return brandLikeRepository.findByMemberIdWithBrand(member.getId()).stream()
                .map(this::toLikedBrandResponse)
                .toList();
    }

    private void refreshItemLikeCnt(Item item) {
        long cnt = itemLikeRepository.countByItemId(item.getId());
        item.setLikeCnt((int) cnt);
        itemRepository.save(item);
    }

    private void refreshBrandLikeCnt(Brand brand) {
        long cnt = brandLikeRepository.countByBrandId(brand.getId());
        brand.setLikeCnt((int) cnt);
        brandRepository.save(brand);
    }

    private LikeDtos.LikedItemResponse toLikedItemResponse(ItemLike itemLike) {
        Item item = itemLike.getItem();
        String mainImg = itemImageRepository
                .findByItemIdAndImageType(item.getId(), ItemImageType.MAIN)
                .map(img -> img.getImageUrl())
                .orElse(null);
        return new LikeDtos.LikedItemResponse(
                item.getId(),
                item.getItemNo(),
                item.getName(),
                item.getBrand() != null ? item.getBrand().getNameKo() : null,
                item.getKind(),
                item.getRentalPrice(),
                item.getRetailPrice(),
                item.getLikeCnt(),
                mainImg,
                ApiDateTimeConverter.toUtcString(itemLike.getCreatedAt())
        );
    }

    private LikeDtos.LikedBrandResponse toLikedBrandResponse(BrandLike brandLike) {
        Brand brand = brandLike.getBrand();
        return new LikeDtos.LikedBrandResponse(
                brand.getId(),
                brand.getNameKo(),
                brand.getNameEn(),
                brand.getIconImageUrl(),
                ApiDateTimeConverter.toUtcString(brandLike.getCreatedAt())
        );
    }

    private Member findMember(String email) {
        return memberStatusService.getActiveMemberByEmail(email);
    }

    private Item findItem(Long itemId) {
        return itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + itemId));
    }

    private int getTotalBrandLikeCnt(Brand brand) {
        int real = brand.getLikeCnt() != null ? brand.getLikeCnt() : 0;
        int dummy = brand.getDummyLikeCnt() != null ? brand.getDummyLikeCnt() : 0;
        return real + dummy;
    }

    private Brand findBrand(Long brandId) {
        return brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId));
    }
}
