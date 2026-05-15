package com.example.demo.catalog.crawl.application;

import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MusinsaCatalogCrawlService {

    private final MusinsaCrawlerExecutor musinsaCrawlerExecutor;
    private final MusinsaCategoryCrawlService musinsaCategoryCrawlService;
    private final MusinsaBrandCrawlService musinsaBrandCrawlService;
    private final MusinsaFilterCrawlService musinsaFilterCrawlService;
    private final MusinsaItemCrawlService musinsaItemCrawlService;

    public CatalogCrawlDtos.CrawlResponse previewAll() {
        return musinsaCrawlerExecutor.execute("all");
    }

    public CatalogCrawlDtos.CrawlResponse previewCategories() {
        return musinsaCategoryCrawlService.previewCategories();
    }

    public CatalogCrawlDtos.CrawlResponse previewBrands() {
        return musinsaBrandCrawlService.previewBrands();
    }

    public CatalogCrawlDtos.CategoryImportResult importCategories() {
        return musinsaCategoryCrawlService.importCategories();
    }

    public CatalogCrawlDtos.BrandImportResult importBrands() {
        return musinsaBrandCrawlService.importBrands();
    }

    public CatalogCrawlDtos.CrawlResponse previewFilters(String categoryCode) {
        return musinsaFilterCrawlService.previewFilters(categoryCode);
    }

    public CatalogCrawlDtos.TagImportResult importFilters(String categoryCode) {
        return musinsaFilterCrawlService.importFilters(categoryCode);
    }

    public CatalogCrawlDtos.ItemImportResult importItems(String categoryCode) {
        return musinsaItemCrawlService.importItems(categoryCode);
    }

    public CatalogCrawlDtos.CrawlTestResponse testItemCrawl(String categoryCode) {
        long startedAt = System.currentTimeMillis();
        CatalogCrawlDtos.CrawlResponse response = musinsaCrawlerExecutor.execute("item", categoryCode);
        long apiElapsedMs = System.currentTimeMillis() - startedAt;
        return new CatalogCrawlDtos.CrawlTestResponse(
                categoryCode,
                apiElapsedMs,
                response.timings(),
                response.itemCount(),
                response.items() != null ? response.items() : java.util.List.of()
        );
    }
}
