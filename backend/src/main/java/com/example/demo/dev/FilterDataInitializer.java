package com.example.demo.dev;

import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterGroup;
import com.example.demo.catalog.filter.domain.FilterGroupRepository;
import com.example.demo.catalog.filter.domain.FilterRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * FilterDataInitializer
 * - 필터 관련 필수 데이터 시드 (멱등성 보장)
 * - DataInitializer(Order 미지정) 이후 실행되도록 Order(2) 지정
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class FilterDataInitializer implements CommandLineRunner {

    private final FilterGroupRepository filterGroupRepository;
    private final FilterRepository filterRepository;

    @Override
    @Transactional
    public void run(String... args) {
        ensureFreeSizeFilter();
    }

    /**
     * "표준 사이즈" 필터 그룹에 "프리 사이즈" 필터 추가
     * - 이미 존재하면 스킵 (code = "FREE_SIZE 로 중복 체크)
     */
    private void ensureFreeSizeFilter() {
        FilterGroup sizeGroup = filterGroupRepository.findByName("표준 사이즈")
                .orElse(null);

        if (sizeGroup == null) {
            log.warn("[FilterDataInitializer] '표준 사이즈' 필터 그룹을 찾을 수 없어 프리 사이즈 추가를 건너뜁니다.");
            return;
        }

        if (filterRepository.existsByCode("FREE_SIZE")) {
            return;
        }

        // 기존 사이즈 필터 중 가장 큰 sortOrder 다음 순서로 추가
        int maxSortOrder = filterRepository
                .findByFilterGroupIdOrderBySortOrderAscIdAsc(sizeGroup.getId())
                .stream()
                .mapToInt(Filter::getSortOrder)
                .max()
                .orElse(0);

        Filter freeSize = new Filter();
        freeSize.setFilterGroup(sizeGroup);
        freeSize.setName("프리 사이즈");
        freeSize.setCode("FREE_SIZE");
        freeSize.setSortOrder(maxSortOrder + 1);
        freeSize.setUseYn(true);

        filterRepository.save(freeSize);
        log.info("[FilterDataInitializer] '프리 사이즈' 필터 추가 완료 (filterGroupId={})", sizeGroup.getId());
    }
}
