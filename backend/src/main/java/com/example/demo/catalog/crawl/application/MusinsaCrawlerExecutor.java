package com.example.demo.catalog.crawl.application;

import com.example.demo.catalog.crawl.dto.CatalogCrawlDtos;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * MusinsaCrawlerExecutor
 * - Python 크롤러 실행과 stdout JSON 파싱만 담당
 */
@Component
@RequiredArgsConstructor
public class MusinsaCrawlerExecutor {

    private final ObjectMapper objectMapper;

    @Value("${crawler.python-command:py}")
    private String pythonCommand;

    @Value("${crawler.script-path:./src/main/java/com/example/demo/crawler/musinsa_catalog_crawler.py}")
    private String scriptPath;

    public CatalogCrawlDtos.CrawlResponse execute(String mode) {
        return execute(mode, null);
    }

    public CatalogCrawlDtos.CrawlResponse execute(String mode, String categoryCode) {
        return execute(mode, categoryCode, 1);
    }

    public CatalogCrawlDtos.CrawlResponse execute(String mode, String categoryCode, int page) {
        Path workingDirectory = Path.of("").toAbsolutePath().normalize();
        Path resolvedScriptPath = Path.of(scriptPath).toAbsolutePath().normalize();

        if (!Files.exists(resolvedScriptPath)) {
            throw new IllegalStateException(
                    "Python 스크립트 파일을 찾을 수 없습니다. "
                            + "scriptPath=" + scriptPath
                            + ", resolvedScriptPath=" + resolvedScriptPath
                            + ", workingDirectory=" + workingDirectory
            );
        }

        List<String> command = new ArrayList<>();
        command.add(pythonCommand);
        command.add(resolvedScriptPath.toString());
        command.add("--mode");
        command.add(mode);
        if (categoryCode != null && !categoryCode.isBlank()) {
            command.add("--category");
            command.add(categoryCode);
        }
        if (page > 1) {
            command.add("--page");
            command.add(String.valueOf(page));
        }

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.environment().put("PYTHONIOENCODING", "UTF-8");

        try {
            Process process = processBuilder.start();

            byte[] stdoutBytes = process.getInputStream().readAllBytes();
            byte[] stderrBytes = process.getErrorStream().readAllBytes();
            int exitCode = process.waitFor();

            String stdout = new String(stdoutBytes, StandardCharsets.UTF_8);
            String stderr = new String(stderrBytes, StandardCharsets.UTF_8);

            if (exitCode != 0) {
                throw new IllegalStateException(
                        "Python 크롤러 실행 실패. "
                                + "exitCode=" + exitCode
                                + ", command=" + command
                                + ", workingDirectory=" + workingDirectory
                                + ", stderr=" + stderr
                );
            }

            if (stdout == null || stdout.isBlank()) {
                throw new IllegalStateException(
                        "Python 크롤러 응답이 비어 있습니다. "
                                + "command=" + command
                                + ", workingDirectory=" + workingDirectory
                                + ", stderr=" + stderr
                );
            }

            return objectMapper.readValue(stdout, CatalogCrawlDtos.CrawlResponse.class);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Python 스크립트 실행 중 IO 오류가 발생했습니다. "
                            + "pythonCommand=" + pythonCommand
                            + ", scriptPath=" + scriptPath
                            + ", resolvedScriptPath=" + resolvedScriptPath
                            + ", workingDirectory=" + workingDirectory,
                    e
            );
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Python 스크립트 실행이 중단되었습니다. "
                            + "pythonCommand=" + pythonCommand
                            + ", scriptPath=" + scriptPath
                            + ", resolvedScriptPath=" + resolvedScriptPath
                            + ", workingDirectory=" + workingDirectory,
                    e
            );
        }
    }

    public CatalogCrawlDtos.CrawlResponse executeItemImage(String itemNo) {
        Path workingDirectory = Path.of("").toAbsolutePath().normalize();
        Path resolvedScriptPath = Path.of(scriptPath).toAbsolutePath().normalize();

        if (!Files.exists(resolvedScriptPath)) {
            throw new IllegalStateException(
                    "Python 스크립트 파일을 찾을 수 없습니다. "
                            + "scriptPath=" + scriptPath
                            + ", resolvedScriptPath=" + resolvedScriptPath
                            + ", workingDirectory=" + workingDirectory
            );
        }

        List<String> command = new ArrayList<>();
        command.add(pythonCommand);
        command.add(resolvedScriptPath.toString());
        command.add("--mode");
        command.add("item-image");
        command.add("--item-no");
        command.add(itemNo);

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.environment().put("PYTHONIOENCODING", "UTF-8");

        try {
            Process process = processBuilder.start();

            byte[] stdoutBytes = process.getInputStream().readAllBytes();
            byte[] stderrBytes = process.getErrorStream().readAllBytes();
            int exitCode = process.waitFor();

            String stdout = new String(stdoutBytes, StandardCharsets.UTF_8);
            String stderr = new String(stderrBytes, StandardCharsets.UTF_8);

            if (exitCode != 0) {
                throw new IllegalStateException(
                        "Python 크롤러 실행 실패. "
                                + "exitCode=" + exitCode
                                + ", command=" + command
                                + ", workingDirectory=" + workingDirectory
                                + ", stderr=" + stderr
                );
            }

            if (stdout == null || stdout.isBlank()) {
                throw new IllegalStateException(
                        "Python 크롤러 응답이 비어 있습니다. "
                                + "command=" + command
                                + ", workingDirectory=" + workingDirectory
                                + ", stderr=" + stderr
                );
            }

            return objectMapper.readValue(stdout, CatalogCrawlDtos.CrawlResponse.class);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Python 스크립트 실행 중 IO 오류가 발생했습니다. "
                            + "pythonCommand=" + pythonCommand
                            + ", scriptPath=" + scriptPath
                            + ", resolvedScriptPath=" + resolvedScriptPath
                            + ", workingDirectory=" + workingDirectory,
                    e
            );
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Python 스크립트 실행이 중단되었습니다. "
                            + "pythonCommand=" + pythonCommand
                            + ", scriptPath=" + scriptPath
                            + ", resolvedScriptPath=" + resolvedScriptPath
                            + ", workingDirectory=" + workingDirectory,
                    e
            );
        }
    }
}
