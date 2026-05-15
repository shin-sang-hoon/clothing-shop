package com.example.demo.catalog.category.api;

import com.example.demo.catalog.category.domain.Category;
import com.example.demo.catalog.category.domain.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CategoryController
 * - 사용자 노출용 카테고리 공개 API
 * - useYn=true 카테고리를 depth + sortOrder 순으로 반환한다.
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    /**
     * 공개 카테고리 전체 조회
     * - useYn=true 항목만 반환
     * - 사이드바 depth 이동형 UI에서 프론트가 직접 트리를 구성할 수 있도록 flat 리스트로 반환
     */
    @GetMapping
    public List<CategoryItem> getCategories() {
        return categoryRepository.findAllWithParent()
                .stream()
                .filter(Category::isUseYn)
                .map(c -> new CategoryItem(
                        c.getId(),
                        c.getName(),
                        c.getCode(),
                        c.getDepth(),
                        c.getParent() != null ? c.getParent().getId() : null,
                        c.getImageUrl(),
                        c.getSortOrder()
                ))
                .toList();
    }

    /**
     * CategoryItem
     * - 사용자용 카테고리 응답
     */
    public record CategoryItem(
            Long id,
            String name,
            String code,
            Integer depth,
            Long parentId,
            String imageUrl,
            Integer sortOrder
    ) {}
}
