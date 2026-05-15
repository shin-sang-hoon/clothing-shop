package com.example.demo.catalog.crawl.application;

import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

@Slf4j
@Service
public class CatalogCrawlJobService {

    private static final String STATUS_RUNNING = "RUNNING";
    private static final String STATUS_SUCCESS = "SUCCESS";
    private static final String STATUS_FAILED = "FAILED";

    private final Map<String, CrawlJob> jobs = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    public CatalogCrawlDtos.CrawlJobStartResponse startJob(String jobType, Supplier<Object> task) {
        String jobId = UUID.randomUUID().toString();
        CrawlJob job = new CrawlJob(jobId, jobType);
        jobs.put(jobId, job);

        executorService.submit(() -> {
            try {
                Object result = task.get();
                job.completeSuccess(result);
            } catch (Exception ex) {
                log.warn("크롤링 비동기 작업 실패. jobId={}, jobType={}", jobId, jobType, ex);
                job.completeFailed("크롤링 실행 중 오류가 발생했습니다: " + ex.getMessage());
            }
        });

        return new CatalogCrawlDtos.CrawlJobStartResponse(
                jobId,
                jobType,
                STATUS_RUNNING,
                "실행중입니다."
        );
    }

    public CatalogCrawlDtos.CrawlJobStatusResponse getJobStatus(String jobId) {
        CrawlJob job = jobs.get(jobId);
        if (job == null) {
            throw new IllegalArgumentException("크롤링 작업을 찾을 수 없습니다. jobId=" + jobId);
        }

        return new CatalogCrawlDtos.CrawlJobStatusResponse(
                job.jobId,
                job.jobType,
                job.status,
                job.message,
                job.startedAt,
                job.finishedAt,
                job.result
        );
    }

    @PreDestroy
    public void shutdownExecutor() {
        executorService.shutdown();
    }

    private static final class CrawlJob {
        private final String jobId;
        private final String jobType;
        private final Instant startedAt;
        private volatile String status;
        private volatile String message;
        private volatile Instant finishedAt;
        private volatile Object result;

        private CrawlJob(String jobId, String jobType) {
            this.jobId = jobId;
            this.jobType = jobType;
            this.startedAt = Instant.now();
            this.status = STATUS_RUNNING;
            this.message = "실행중입니다.";
        }

        private void completeSuccess(Object result) {
            this.status = STATUS_SUCCESS;
            this.message = "완료되었습니다.";
            this.finishedAt = Instant.now();
            this.result = result;
        }

        private void completeFailed(String message) {
            this.status = STATUS_FAILED;
            this.message = message;
            this.finishedAt = Instant.now();
            this.result = null;
        }
    }
}
