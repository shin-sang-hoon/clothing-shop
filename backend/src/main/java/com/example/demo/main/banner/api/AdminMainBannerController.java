package com.example.demo.main.banner.api;

import com.example.demo.audit.application.AuditLogService;
import com.example.demo.audit.domain.AuditCategory;
import com.example.demo.audit.domain.AuditEventType;
import com.example.demo.main.banner.application.MainBannerService;
import com.example.demo.main.banner.dto.MainBannerDtos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/main-banners")
@RequiredArgsConstructor
public class AdminMainBannerController {

    private final MainBannerService mainBannerService;
    private final AuditLogService auditLogService;

    @GetMapping
    public List<MainBannerDtos.AdminBannerResponse> getBanners() {
        return mainBannerService.getAdminBanners();
    }

    @GetMapping("/debug-fetch")
    public MainBannerDtos.BannerFetchDebugResponse debugFetch() {
        return mainBannerService.debugFetch();
    }

    @PostMapping("/import")
    public MainBannerDtos.ImportBannerResult importBanners(HttpServletRequest request) {
        MainBannerDtos.ImportBannerResult result = mainBannerService.importBanners();
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.MAIN_BANNER_IMPORT,
                "메인 배너 가져오기: imported=" + result.importedCount() + ", skipped=" + result.skippedCount(),
                request
        );
        return result;
    }

    @PostMapping
    public MainBannerDtos.AdminBannerResponse createBanner(
            @Valid @RequestBody MainBannerDtos.CreateBannerRequest request,
            HttpServletRequest httpServletRequest
    ) {
        MainBannerDtos.AdminBannerResponse response = mainBannerService.createBanner(request);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.MAIN_BANNER_CREATE,
                "메인 배너 생성: bannerId=" + response.id() + ", code=" + response.code(),
                httpServletRequest
        );
        return response;
    }

    @PutMapping("/{bannerId}")
    public MainBannerDtos.AdminBannerResponse updateBanner(
            @PathVariable Long bannerId,
            @Valid @RequestBody MainBannerDtos.UpdateBannerRequest request,
            HttpServletRequest httpServletRequest
    ) {
        MainBannerDtos.AdminBannerResponse response = mainBannerService.updateBanner(bannerId, request);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.MAIN_BANNER_UPDATE,
                "메인 배너 수정: bannerId=" + bannerId + ", code=" + response.code(),
                httpServletRequest
        );
        return response;
    }

    @DeleteMapping("/{bannerId}")
    public void deleteBanner(
            @PathVariable Long bannerId,
            HttpServletRequest httpServletRequest
    ) {
        mainBannerService.deleteBanner(bannerId);
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.MAIN_BANNER_DELETE,
                "메인 배너 삭제: bannerId=" + bannerId,
                httpServletRequest
        );
    }

    @DeleteMapping
    public void deleteBanners(
            @Valid @RequestBody MainBannerDtos.DeleteBannersRequest request,
            HttpServletRequest httpServletRequest
    ) {
        mainBannerService.deleteBanners(request.bannerIds());
        auditLogService.logCurrentActorAction(
                AuditCategory.SHOP,
                AuditEventType.MAIN_BANNER_DELETE,
                "메인 배너 선택 삭제: count=" + request.bannerIds().size(),
                httpServletRequest
        );
    }
}
