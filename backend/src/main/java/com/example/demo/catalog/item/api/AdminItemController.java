package com.example.demo.catalog.item.api;

import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.catalog.item.application.AdminItemService;
import com.example.demo.catalog.crawl.application.CatalogCrawlJobService;
import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import com.example.demo.catalog.item.dto.AdminItemDtos;
import com.example.demo.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 관리자 상품 API 컨트롤러
 *
 * - 상품 목록 조회
 * - 상품 상세 조회
 * - 상품 등록 / 수정 / 삭제
 * - 사용 여부 변경
 * - 선택 삭제
 * - 렌탈 재고 초기화
 * - 태그/가격/카테고리 기준 일괄 처리
 */
@RestController
@RequestMapping("/api/admin/items")
@RequiredArgsConstructor
public class AdminItemController {

        /**
         * 관리자 상품 서비스
         */
        private final AdminItemService adminItemService;
        private final CatalogCrawlJobService catalogCrawlJobService;

        /**
         * 관리자 액션 로그 서비스
         */
        private final AuditLogService auditLogService;

        /**
         * 선택 삭제 요청 DTO
         *
         * @param itemIds 삭제할 상품 ID 목록
         */
        public record BulkDeleteRequest(
                        List<Long> itemIds) {
        }

        /**
         * 상품 목록 조회
         *
         * - hasFilter / hasAttribute / itemMode 모두 지원
         * - 병합 충돌 시 양쪽 기능을 모두 살린 최종본
         */
        @GetMapping
        public PageResponse<AdminItemDtos.ItemListResponse> getItems(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) String kind,
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) Long categoryId,
                        @RequestParam(required = false) Long tagId,
                        @RequestParam(required = false) Boolean hasFilter,
                        @RequestParam(required = false) Boolean hasAttribute,
                        @RequestParam(required = false) Boolean hasTag,
                        @RequestParam(required = false) String itemMode) {
                Boolean effectiveHasTag = hasTag != null ? hasTag : hasAttribute;
                // 서비스 시그니처도 동일하게 맞아 있어야 한다.
                return adminItemService.getItems(
                                page,
                                size,
                                keyword,
                                kind,
                                status,
                                categoryId,
                                tagId,
                                hasFilter,
                                effectiveHasTag,
                                itemMode);
        }

        /**
         * 상품 선택 삭제
         *
         * body 예시:
         * {
         * "itemIds": [1, 2, 3]
         * }
         */
        @PostMapping("/bulk-delete")
        public Map<String, Object> bulkDeleteItems(
                        @RequestBody BulkDeleteRequest req,
                        HttpServletRequest request) {
                int deleted = adminItemService.bulkDeleteItems(req == null ? null : req.itemIds());

                auditLogService.logCurrentActorAction(
                                AuditCategory.SHOP,
                                AuditEventType.ITEM_DELETE,
                                "상품 선택 삭제: count=" + deleted,
                                request);

                return Map.of("deleted", deleted);
        }

        @PostMapping("/bulk-crawl-images")
        public CatalogCrawlDtos.CrawlJobStartResponse bulkCrawlImages(
                        @RequestBody BulkDeleteRequest req,
                        HttpServletRequest request) {
                List<Long> itemIds = req == null ? null : req.itemIds();
                CatalogCrawlDtos.CrawlJobStartResponse response = catalogCrawlJobService.startJob(
                                "ITEM_IMAGE_CRAWL",
                                () -> adminItemService.bulkRefreshItemImages(itemIds));

                auditLogService.logCurrentActorAction(
                                AuditCategory.SHOP,
                                AuditEventType.ITEM_UPDATE,
                                "상품 선택 이미지 가져오기 작업 시작: jobId=" + response.jobId(),
                                request);

                return response;
        }

        @PostMapping("/crawl-thumbnails-all")
        public CatalogCrawlDtos.CrawlJobStartResponse crawlThumbnailsAll(HttpServletRequest request) {
                CatalogCrawlDtos.CrawlJobStartResponse response = catalogCrawlJobService.startJob(
                                "ITEM_THUMBNAIL_CRAWL_ALL",
                                adminItemService::refreshMainThumbnailForAllItems);

                auditLogService.logCurrentActorAction(
                                AuditCategory.SHOP,
                                AuditEventType.ITEM_UPDATE,
                                "전체 썸네일 가져오기 작업 시작: jobId=" + response.jobId(),
                                request);

                return response;
        }

        @GetMapping("/bulk-crawl-images/jobs/{jobId}")
        public CatalogCrawlDtos.CrawlJobStatusResponse getBulkCrawlImagesJobStatus(@PathVariable String jobId) {
                return catalogCrawlJobService.getJobStatus(jobId);
        }

        /**
         * 렌탈 재고 초기화
         *
         * - RENTAL / BOTH 상품 중 옵션이 없는 상품에 기본 재고를 넣는 용도
         */
        @PostMapping("/init-rental-stock")
        public Map<String, Object> initRentalStock() {
                return adminItemService.initRentalStock();
        }

        /**
         * 상품 상세 조회
         */
        @GetMapping("/{itemId}")
        public AdminItemDtos.ItemDetailResponse getItem(
                        @PathVariable Long itemId) {
                return adminItemService.getItem(itemId);
        }

        /**
         * 상품 등록
         */
        @PostMapping
        public AdminItemDtos.ItemDetailResponse createItem(
                        @Valid @RequestBody AdminItemDtos.CreateItemRequest req,
                        HttpServletRequest request) {
                AdminItemDtos.ItemDetailResponse response = adminItemService.createItem(req);

                auditLogService.logCurrentActorAction(
                                AuditCategory.SHOP,
                                AuditEventType.ITEM_CREATE,
                                "상품 생성: itemId=" + response.id() + ", name=" + response.name(),
                                request);

                return response;
        }

        /**
         * 상품 수정
         */
        @PutMapping("/{itemId}")
        public AdminItemDtos.ItemDetailResponse updateItem(
                        @PathVariable Long itemId,
                        @Valid @RequestBody AdminItemDtos.UpdateItemRequest req,
                        HttpServletRequest request) {
                AdminItemDtos.ItemDetailResponse response = adminItemService.updateItem(itemId, req);

                auditLogService.logCurrentActorAction(
                                AuditCategory.SHOP,
                                AuditEventType.ITEM_UPDATE,
                                "상품 수정: itemId=" + itemId + ", name=" + response.name(),
                                request);

                return response;
        }

        /**
         * 상품 삭제
         */
        @DeleteMapping("/{itemId}")
        public void deleteItem(
                        @PathVariable Long itemId,
                        HttpServletRequest request) {
                adminItemService.deleteItem(itemId);

                auditLogService.logCurrentActorAction(
                                AuditCategory.SHOP,
                                AuditEventType.ITEM_DELETE,
                                "상품 삭제: itemId=" + itemId,
                                request);
        }

        /**
         * 특정 태그명을 가진 상품들의 itemMode 일괄 변경
         *
         * 예시:
         * PATCH /api/admin/items/bulk-mode-by-tag?tagName=부티크&mode=BOTH
         */
        @PatchMapping("/bulk-mode-by-tag")
        public Map<String, Object> bulkModeByTag(
                        @RequestParam String tagName,
                        @RequestParam(defaultValue = "BOTH") String mode) {
                int updated = adminItemService.bulkUpdateItemModeByTagName(tagName, mode);
                return Map.of(
                                "updated", updated,
                                "tagName", tagName,
                                "mode", mode);
        }

        /**
         * 가격 기준으로 태그 일괄 추가
         *
         * 예시:
         * POST /api/admin/items/tag-by-price?tagName=부티크&minPrice=1000000
         */
        @PostMapping("/tag-by-price")
        public Map<String, Object> addTagByPrice(
                        @RequestParam String tagName,
                        @RequestParam int minPrice) {
                int added = adminItemService.addTagToItemsByMinPrice(tagName, minPrice);
                return Map.of(
                                "added", added,
                                "tagName", tagName,
                                "minPrice", minPrice);
        }

        /**
         * 카테고리 코드 기준으로 부티크 상품 동기화
         *
         * - threshold 이상: RENTAL
         * - threshold 미만: AUCTION
         */
        @PatchMapping("/sync-boutique")
        public Map<String, Object> syncBoutique(
                        @RequestParam String categoryCode,
                        @RequestParam(defaultValue = "500000") int threshold) {
                return adminItemService.syncBoutiqueByPrice(categoryCode, threshold);
        }

        /**
         * 사용 여부 변경
         */
        @PatchMapping("/{itemId}/use")
        public AdminItemDtos.ItemDetailResponse updateUseYn(
                        @PathVariable Long itemId,
                        @Valid @RequestBody AdminItemDtos.UpdateItemUseRequest req,
                        HttpServletRequest request) {
                AdminItemDtos.ItemDetailResponse response = adminItemService.updateUseYn(itemId, req);

                auditLogService.logCurrentActorAction(
                                AuditCategory.SHOP,
                                AuditEventType.ITEM_USE_UPDATE,
                                "상품 사용여부 변경: itemId=" + itemId + ", useYn=" + req.useYn(),
                                request);

                return response;
        }

        /**
         * 필터 매칭 진단
         */
        @GetMapping("/diagnose-filter")
        public Map<String, Object> diagnoseFilter(
                        @RequestParam String categoryCode,
                        @RequestParam(required = false) List<Long> filterIds,
                        @RequestParam(required = false) String itemMode) {
                return adminItemService.diagnoseFilterMatching(categoryCode, filterIds, itemMode);
        }

        /**
         * 필터가 없는 상품 조회
         */
        @GetMapping("/no-filter")
        public PageResponse<AdminItemDtos.ItemListResponse> getNoFilterItems(
                        @RequestParam Long categoryId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        @RequestParam(required = false) String itemMode) {
                return adminItemService.getNoFilterItemsByCategoryId(categoryId, page, size, itemMode);
        }

        /**
         * 태그가 없는 상품 조회
         */
        @GetMapping("/no-tag")
        public PageResponse<AdminItemDtos.ItemListResponse> getNoTagItems(
                        @RequestParam Long categoryId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        @RequestParam(required = false) String itemMode) {
                return adminItemService.getNoTagItemsByCategoryId(categoryId, page, size, itemMode);
        }
}
