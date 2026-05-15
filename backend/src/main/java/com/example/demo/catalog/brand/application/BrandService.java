package com.example.demo.catalog.brand.application;

import com.example.demo.catalog.brand.domain.Brand;
import com.example.demo.catalog.brand.domain.BrandDisplayTagMapRepository;
import com.example.demo.catalog.brand.domain.BrandFilterMapRepository;
import com.example.demo.catalog.brand.domain.BrandRepository;
import com.example.demo.catalog.brand.domain.BrandTagMapRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.example.demo.catalog.brand.dto.AdminBrandDtos;
import com.example.demo.catalog.brand.dto.BrandDtos;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.like.domain.BrandLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * BrandService
 * - 관리자 브랜드 관리 서비스
 * - 사용자 노출용 브랜드 목록 조회도 함께 담당한다.
 */
@Service
@RequiredArgsConstructor
public class BrandService {

    /**
     * 한글 초성 테이블
     */
    private static final String[] KOREAN_INITIALS = {
            "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
            "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
    };

    /**
     * 쌍자음은 기본 초성으로 묶는다.
     */
    private static final java.util.Map<String, String> CHOSUNG_GROUP = java.util.Map.of(
            "ㄲ", "ㄱ",
            "ㄸ", "ㄷ",
            "ㅃ", "ㅂ",
            "ㅆ", "ㅅ",
            "ㅉ", "ㅈ"
    );

    private final BrandRepository brandRepository;
    private final ItemRepository itemRepository;
    private final BrandLikeRepository brandLikeRepository;
    private final BrandFilterMapRepository brandFilterMapRepository;
    private final BrandTagMapRepository brandTagMapRepository;
    private final BrandDisplayTagMapRepository brandDisplayTagMapRepository;

    @PersistenceContext
    private EntityManager em;

    /**
     * 관리자 목록 조회
     * - 현재는 메모리 필터를 유지
     * - 응답은 공통 PageResponse<T> 로 통일
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminBrandDtos.BrandListResponse> getBrands(
            int page,
            int size,
            String keyword,
            Boolean exclusiveYn,
            Boolean useYn
    ) {
        Pageable pageable = createPageable(page, size, 10);

        List<AdminBrandDtos.BrandListResponse> filteredContent = brandRepository.findAll(
                        Sort.by(
                                Sort.Order.asc("sortOrder"),
                                Sort.Order.asc("id")
                        )
                ).stream()
                .filter(brand -> matchesKeyword(brand, keyword))
                .filter(brand -> matchesExclusiveYn(brand, exclusiveYn))
                .filter(brand -> matchesUseYn(brand, useYn))
                .map(this::toAdminListResponse)
                .toList();

        return toPageResponse(filteredContent, pageable);
    }

    /**
     * 사용자 목록 조회
     * - useYn=true 브랜드만 노출
     * - keyword 검색: DB 레벨 LIKE (빠름)
     * - initialConsonant 필터: useYn=true 전체 로드 후 메모리 필터
     * - keyword + initialConsonant 조합: DB LIKE 후 메모리 초성 필터
     */
    @Transactional(readOnly = true)
    public BrandDtos.BrandListResponse getPublicBrandById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다: " + id));
        return toPublicListResponse(brand);
    }

    @Transactional(readOnly = true)
    public PageResponse<BrandDtos.BrandListResponse> getPublicBrands(
            int page,
            int size,
            String keyword,
            String initialConsonant,
            String sort
    ) {
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasConsonant = initialConsonant != null && !initialConsonant.isBlank();

        // 정렬 포함 Pageable
        Pageable pageable = createPageableWithSort(page, size, sort);

        if (hasKeyword) {
            // DB 레벨 LIKE 검색 → 결과가 작으므로 메모리 초성 필터 적용 가능
            Page<Brand> dbPage = brandRepository.findByUseYnTrueAndKeyword(keyword.trim(), pageable);

            List<BrandDtos.BrandListResponse> content = dbPage.getContent().stream()
                    .filter(b -> !hasConsonant || matchesInitialConsonant(b, initialConsonant))
                    .map(this::toPublicListResponse)
                    .toList();

            // keyword 결과가 이미 DB 페이지네이션 되어 있으므로 그대로 반환
            return new PageResponse<>(
                    content,
                    dbPage.getNumber(),
                    dbPage.getSize(),
                    dbPage.getTotalElements(),
                    dbPage.getTotalPages(),
                    dbPage.isFirst(),
                    dbPage.isLast()
            );
        }

        if (hasConsonant) {
            // 초성 필터: useYn=true 전체 로드 후 메모리 필터 + 페이지네이션
            Comparator<Brand> comparator = resolvePublicSort(sort);
            List<BrandDtos.BrandListResponse> filtered = brandRepository
                    .findByUseYnTrueOrderBySortOrderAscIdAsc()
                    .stream()
                    .filter(b -> matchesInitialConsonant(b, initialConsonant))
                    .sorted(comparator)
                    .map(this::toPublicListResponse)
                    .toList();

            return toPageResponse(filtered, PageRequest.of(page, size <= 0 ? 30 : size));
        }

        // 필터 없음: DB 레벨 페이지네이션
        Page<Brand> dbPage = brandRepository.findByUseYnTrue(pageable);
        List<BrandDtos.BrandListResponse> content = dbPage.getContent().stream()
                .map(this::toPublicListResponse)
                .toList();

        return new PageResponse<>(
                content,
                dbPage.getNumber(),
                dbPage.getSize(),
                dbPage.getTotalElements(),
                dbPage.getTotalPages(),
                dbPage.isFirst(),
                dbPage.isLast()
        );
    }

    /**
     * 상세 조회
     */
    @Transactional(readOnly = true)
    public AdminBrandDtos.BrandDetailResponse getBrand(Long brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId));

        return toDetailResponse(brand);
    }

    /**
     * 등록
     */
    @Transactional
    public AdminBrandDtos.BrandDetailResponse createBrand(AdminBrandDtos.CreateBrandRequest req) {
        validateDuplicateCode(null, req.code());
        validateDuplicateNameKo(null, req.nameKo());
        validateDuplicateNameEn(null, req.nameEn());

        Brand brand = new Brand();
        applyBrandFields(
                brand,
                req.code(),
                req.nameKo(),
                req.nameEn(),
                req.iconImageUrl(),
                req.exclusiveYn(),
                req.sortOrder(),
                req.useYn(),
                req.description()
        );

        Brand savedBrand = brandRepository.save(brand);
        return toDetailResponse(savedBrand);
    }

    /**
     * 수정
     */
    @Transactional
    public AdminBrandDtos.BrandDetailResponse updateBrand(
            Long brandId,
            AdminBrandDtos.UpdateBrandRequest req
    ) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId));

        validateDuplicateCode(brandId, req.code());
        validateDuplicateNameKo(brandId, req.nameKo());
        validateDuplicateNameEn(brandId, req.nameEn());

        applyBrandFields(
                brand,
                req.code(),
                req.nameKo(),
                req.nameEn(),
                req.iconImageUrl(),
                req.exclusiveYn(),
                req.sortOrder(),
                req.useYn(),
                req.description()
        );

        return toDetailResponse(brand);
    }

    /**
     * 사용 여부 변경
     */
    @Transactional
    public AdminBrandDtos.BrandDetailResponse updateUseYn(
            Long brandId,
            AdminBrandDtos.UpdateBrandUseRequest req
    ) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId));

        brand.setUseYn(req.useYn());

        return toDetailResponse(brand);
    }

    /**
     * 상품이 없는 브랜드 일괄 삭제
     * - FK_CHECKS 비활성화 후 관련 테이블 정리, 이후 brand 삭제
     */
    @Transactional
    public int deleteEmptyBrands() {
        List<Brand> empty = brandRepository.findBrandsWithNoItems();
        if (empty.isEmpty()) return 0;
        List<Long> ids = empty.stream().map(Brand::getId).toList();

        em.createNativeQuery("SET FOREIGN_KEY_CHECKS = 0").executeUpdate();
        try {
            String idList = ids.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(","));
            em.createNativeQuery("DELETE FROM brand_like WHERE brand_id IN (" + idList + ")").executeUpdate();
            em.createNativeQuery("DELETE FROM brand_filter_map WHERE brand_id IN (" + idList + ")").executeUpdate();
            em.createNativeQuery("DELETE FROM brand_tag_map WHERE brand_id IN (" + idList + ")").executeUpdate();
            em.createNativeQuery("DELETE FROM brand_display_tag_map WHERE brand_id IN (" + idList + ")").executeUpdate();
            em.createNativeQuery("DELETE FROM brand WHERE id IN (" + idList + ")").executeUpdate();
        } finally {
            em.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();
        }
        return empty.size();
    }

    /**
     * 더미 좋아요 수 일괄 부여
     * - 이미 dummyLikeCnt > 0 인 브랜드는 건너뜀
     * - 50 ~ 500 사이 랜덤값 부여
     */
    @Transactional
    public int seedDummyLikes() {
        java.util.Random rnd = new java.util.Random();
        List<Brand> brands = brandRepository.findAll();
        int count = 0;
        for (Brand b : brands) {
            if (b.getDummyLikeCnt() == null || b.getDummyLikeCnt() == 0) {
                b.setDummyLikeCnt(50 + rnd.nextInt(451));
                count++;
            }
        }
        brandRepository.saveAll(brands);
        return count;
    }

    /**
     * 삭제
     * - 해당 브랜드를 참조하는 상품의 brand_id를 먼저 null로 초기화한 뒤 삭제한다.
     */
    @Transactional
    public void deleteBrand(Long brandId) {
        if (!brandRepository.existsById(brandId)) {
            throw new IllegalArgumentException("브랜드를 찾을 수 없습니다. id=" + brandId);
        }
        itemRepository.nullifyBrandId(brandId);
        brandRepository.deleteById(brandId);
    }

    /**
     * 브랜드 공통 필드 반영
     */
    private void applyBrandFields(
            Brand brand,
            String code,
            String nameKo,
            String nameEn,
            String iconImageUrl,
            Boolean exclusiveYn,
            Integer sortOrder,
            Boolean useYn,
            String description
    ) {
        brand.setCode(normalizeCode(code));
        brand.setNameKo(normalizeName(nameKo));
        brand.setNameEn(normalizeEnglishName(nameEn));
        brand.setIconImageUrl(normalizeNullableText(iconImageUrl));
        brand.setExclusiveYn(Boolean.TRUE.equals(exclusiveYn));
        brand.setSortOrder(sortOrder != null ? sortOrder : 0);
        brand.setUseYn(Boolean.TRUE.equals(useYn));
        brand.setDescription(normalizeNullableText(description));
    }

    /**
     * 코드 중복 검증
     */
    private void validateDuplicateCode(Long brandId, String rawCode) {
        String normalizedCode = normalizeCode(rawCode);

        brandRepository.findByCode(normalizedCode).ifPresent(found -> {
            if (brandId == null || !found.getId().equals(brandId)) {
                throw new IllegalArgumentException("이미 사용 중인 브랜드 코드입니다.");
            }
        });
    }

    /**
     * 국문명 중복 검증
     */
    private void validateDuplicateNameKo(Long brandId, String rawNameKo) {
        String normalizedNameKo = normalizeName(rawNameKo);

        List<Brand> brands = brandRepository.findAll();
        boolean duplicated = brands.stream()
                .anyMatch(brand ->
                        brand.getNameKo().equalsIgnoreCase(normalizedNameKo)
                                && (brandId == null || !brand.getId().equals(brandId))
                );

        if (duplicated) {
            throw new IllegalArgumentException("이미 사용 중인 브랜드 국문명입니다.");
        }
    }

    /**
     * 영문명 중복 검증
     */
    private void validateDuplicateNameEn(Long brandId, String rawNameEn) {
        String normalizedNameEn = normalizeEnglishName(rawNameEn);

        List<Brand> brands = brandRepository.findAll();
        boolean duplicated = brands.stream()
                .anyMatch(brand ->
                        brand.getNameEn().equalsIgnoreCase(normalizedNameEn)
                                && (brandId == null || !brand.getId().equals(brandId))
                );

        if (duplicated) {
            throw new IllegalArgumentException("이미 사용 중인 브랜드 영문명입니다.");
        }
    }

    /**
     * 키워드 필터
     */
    private boolean matchesKeyword(Brand brand, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        String normalizedKeyword = keyword.trim().toLowerCase();

        return brand.getNameKo().toLowerCase().contains(normalizedKeyword)
                || brand.getNameEn().toLowerCase().contains(normalizedKeyword)
                || brand.getCode().toLowerCase().contains(normalizedKeyword);
    }

    /**
     * 사용자용 초성 필터
     * - 한글 브랜드명은 초성으로 비교한다.
     * - 비한글 시작 브랜드는 첫 글자 대문자로 비교한다.
     */
    private boolean matchesInitialConsonant(Brand brand, String initialConsonant) {
        if (initialConsonant == null || initialConsonant.isBlank()) {
            return true;
        }

        String normalizedInitial = initialConsonant.trim();
        return extractInitialConsonant(brand.getNameKo()).equals(normalizedInitial);
    }

    /**
     * 단독 여부 필터
     */
    private boolean matchesExclusiveYn(Brand brand, Boolean exclusiveYn) {
        if (exclusiveYn == null) {
            return true;
        }

        return brand.isExclusiveYn() == exclusiveYn;
    }

    /**
     * 사용 여부 필터
     */
    private boolean matchesUseYn(Brand brand, Boolean useYn) {
        if (useYn == null) {
            return true;
        }

        return brand.isUseYn() == useYn;
    }

    /**
     * 관리자 목록 응답 변환
     */
    private AdminBrandDtos.BrandListResponse toAdminListResponse(Brand brand) {
        return new AdminBrandDtos.BrandListResponse(
                brand.getId(),
                brand.getCode(),
                brand.getNameKo(),
                brand.getNameEn(),
                brand.getIconImageUrl(),
                brand.isExclusiveYn(),
                brand.getSortOrder(),
                brand.isUseYn(),
                brand.getDescription(),
                ApiDateTimeConverter.toUtcString(brand.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(brand.getUpdatedAt())
        );
    }

    /**
     * 사용자 목록 응답 변환
     */
    private BrandDtos.BrandListResponse toPublicListResponse(Brand brand) {
        int totalLike = (brand.getDummyLikeCnt() != null ? brand.getDummyLikeCnt() : 0)
                      + (brand.getLikeCnt() != null ? brand.getLikeCnt() : 0);
        return new BrandDtos.BrandListResponse(
                brand.getId(),
                brand.getCode(),
                brand.getNameKo(),
                brand.getNameEn(),
                brand.getIconImageUrl(),
                brand.isExclusiveYn(),
                brand.getSortOrder(),
                totalLike
        );
    }

    /**
     * 상세 응답 변환
     */
    private AdminBrandDtos.BrandDetailResponse toDetailResponse(Brand brand) {
        return new AdminBrandDtos.BrandDetailResponse(
                brand.getId(),
                brand.getCode(),
                brand.getNameKo(),
                brand.getNameEn(),
                brand.getIconImageUrl(),
                brand.isExclusiveYn(),
                brand.getSortOrder(),
                brand.isUseYn(),
                brand.getDescription(),
                ApiDateTimeConverter.toUtcString(brand.getCreatedAt()),
                ApiDateTimeConverter.toUtcString(brand.getUpdatedAt())
        );
    }

    /**
     * Pageable 생성 (정렬 없음)
     */
    private Pageable createPageable(int page, int size, int defaultSize) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? defaultSize : size;

        return PageRequest.of(safePage, safeSize);
    }

    /**
     * 정렬 포함 Pageable 생성 (사용자 브랜드 목록용)
     */
    private Pageable createPageableWithSort(int page, int size, String sort) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 30 : size;

        Sort dbSort;
        if ("nameAsc".equalsIgnoreCase(sort)) {
            dbSort = Sort.by(Sort.Order.asc("nameKo"));
        } else if ("nameDesc".equalsIgnoreCase(sort)) {
            dbSort = Sort.by(Sort.Order.desc("nameKo"));
        } else {
            dbSort = Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id"));
        }

        return PageRequest.of(safePage, safeSize, dbSort);
    }

    /**
     * 공통 페이지 응답으로 변환
     */
    private <T> PageResponse<T> toPageResponse(
            List<T> filteredContent,
            Pageable pageable
    ) {
        int totalElements = filteredContent.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / pageable.getPageSize());
        int fromIndex = Math.min((int) pageable.getOffset(), totalElements);
        int toIndex = Math.min(fromIndex + pageable.getPageSize(), totalElements);

        return new PageResponse<>(
                filteredContent.subList(fromIndex, toIndex),
                pageable.getPageNumber(),
                pageable.getPageSize(),
                totalElements,
                totalPages,
                pageable.getPageNumber() == 0,
                totalPages == 0 || pageable.getPageNumber() >= totalPages - 1
        );
    }

    /**
     * 사용자용 정렬 기준 해석
     * - default  : sortOrder asc, id asc
     * - nameAsc  : 국문명 가나다 오름차순
     * - nameDesc : 국문명 가나다 내림차순
     */
    private Comparator<Brand> resolvePublicSort(String sort) {
        if ("nameAsc".equalsIgnoreCase(sort)) {
            return Comparator.comparing(
                    Brand::getNameKo,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
            ).thenComparing(Brand::getId);
        }

        if ("nameDesc".equalsIgnoreCase(sort)) {
            return Comparator.comparing(
                    Brand::getNameKo,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
            ).reversed().thenComparing(Brand::getId);
        }

        return Comparator.comparing(Brand::getSortOrder)
                .thenComparing(Brand::getId);
    }

    /**
     * 브랜드명 첫 글자의 초성을 구한다.
     */
    private String extractInitialConsonant(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        char firstChar = value.trim().charAt(0);
        int code = firstChar - 0xAC00;

        if (code < 0 || code > 11171) {
            return String.valueOf(Character.toUpperCase(firstChar));
        }

        String initial = KOREAN_INITIALS[code / 588];
        return CHOSUNG_GROUP.getOrDefault(initial, initial);
    }

    /**
     * 코드 정리
     */
    private String normalizeCode(String code) {
        if (code == null) {
            return "";
        }

        return code.trim()
                .replace(" ", "_")
                .toUpperCase();
    }

    /**
     * 이름 정리
     */
    private String normalizeName(String value) {
        return value == null ? "" : value.trim();
    }

    /**
     * 영문명 정리
     */
    private String normalizeEnglishName(String value) {
        return value == null ? "" : value.trim();
    }

    /**
     * nullable 문자열 정리
     */
    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
