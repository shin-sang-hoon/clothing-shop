package com.example.demo.catalog.mapping.application;

import com.example.demo.catalog.mapping.dto.AdminMappingDtos;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

@Slf4j
@Service
public class MappingAutoSyncJobService {

    private static final String STATUS_RUNNING = "RUNNING";
    private static final String STATUS_SUCCESS = "SUCCESS";
    private static final String STATUS_FAILED = "FAILED";

    private final Map<String, MappingJob> jobs = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    public AdminMappingDtos.MappingJobStartResponse startJob(String jobType, Supplier<Object> task) {
        String jobId = UUID.randomUUID().toString();
        MappingJob job = new MappingJob(jobId, jobType);
        jobs.put(jobId, job);

        executorService.submit(() -> {
            try {
                Object result = task.get();
                job.completeSuccess(result);
            } catch (Exception exception) {
                log.warn("매핑 자동화 비동기 작업 실패. jobId={}, jobType={}", jobId, jobType, exception);
                job.completeFailed("매핑 자동화 실행 중 오류가 발생했습니다: " + exception.getMessage());
            }
        });

        return new AdminMappingDtos.MappingJobStartResponse(
                jobId,
                jobType,
                STATUS_RUNNING,
                "실행되었습니다."
        );
    }

    public AdminMappingDtos.MappingJobStatusResponse getJobStatus(String jobId) {
        MappingJob job = jobs.get(jobId);
        if (job == null) {
            throw new IllegalArgumentException("매핑 작업을 찾을 수 없습니다. jobId=" + jobId);
        }

        return new AdminMappingDtos.MappingJobStatusResponse(
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

    private static final class MappingJob {
        private final String jobId;
        private final String jobType;
        private final Instant startedAt;
        private volatile String status;
        private volatile String message;
        private volatile Instant finishedAt;
        private volatile Object result;

        private MappingJob(String jobId, String jobType) {
            this.jobId = jobId;
            this.jobType = jobType;
            this.startedAt = Instant.now();
            this.status = STATUS_RUNNING;
            this.message = "실행 중입니다.";
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
