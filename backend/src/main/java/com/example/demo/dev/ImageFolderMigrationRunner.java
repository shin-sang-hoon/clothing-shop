package com.example.demo.dev;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * 이미지 폴더명 마이그레이션 (한글 → 영어)
 * - 썸네일 → thumbnail
 * - 컨텐츠  → content
 * 앱 시작 시 1회 실행 (idempotent)
 */
@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class ImageFolderMigrationRunner implements CommandLineRunner {

    private static final String OLD_THUMBNAIL = "썸네일";
    private static final String NEW_THUMBNAIL = "thumbnail";
    private static final String OLD_CONTENT = "컨텐츠";
    private static final String NEW_CONTENT = "content";

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.upload-root:./uploads}")
    private String uploadRoot;

    @Override
    public void run(String... args) {
        migrateDatabase();
        migrateFilesystem();
        fixFilterGroupRoles();
    }

    private void migrateDatabase() {
        // item_image.image_url 업데이트
        int imageCount = jdbcTemplate.update(
                "UPDATE item_image SET image_url = REPLACE(REPLACE(image_url, ?, ?), ?, ?) " +
                "WHERE image_url LIKE ? OR image_url LIKE ?",
                "/" + OLD_THUMBNAIL + "/", "/" + NEW_THUMBNAIL + "/",
                "/" + OLD_CONTENT + "/", "/" + NEW_CONTENT + "/",
                "%/" + OLD_THUMBNAIL + "/%", "%/" + OLD_CONTENT + "/%"
        );
        if (imageCount > 0) {
            log.info("[ImageFolderMigration] item_image URL 마이그레이션 완료: {}건", imageCount);
        }

        // item.detail_content 업데이트
        int contentCount = jdbcTemplate.update(
                "UPDATE item SET detail_content = REPLACE(REPLACE(detail_content, ?, ?), ?, ?) " +
                "WHERE detail_content LIKE ? OR detail_content LIKE ?",
                "/" + OLD_THUMBNAIL + "/", "/" + NEW_THUMBNAIL + "/",
                "/" + OLD_CONTENT + "/", "/" + NEW_CONTENT + "/",
                "%/" + OLD_THUMBNAIL + "/%", "%/" + OLD_CONTENT + "/%"
        );
        if (contentCount > 0) {
            log.info("[ImageFolderMigration] item detail_content URL 마이그레이션 완료: {}건", contentCount);
        }
    }

    private void fixFilterGroupRoles() {
        int count = jdbcTemplate.update(
                "UPDATE filter_group SET group_role = 'ALL' " +
                "WHERE group_role = 'ATTRIBUTE' " +
                "AND id IN (" +
                "  SELECT DISTINCT f.filter_group_id FROM filter f " +
                "  INNER JOIN item_option io ON io.source_tag_id = f.id" +
                ")"
        );
        if (count > 0) {
            log.info("[ImageFolderMigration] 필터 그룹 role ATTRIBUTE→ALL 변경: {}건", count);
        }
    }

    private void migrateFilesystem() {
        Path itemRoot = Path.of(uploadRoot, "item").toAbsolutePath().normalize();
        if (!Files.exists(itemRoot)) {
            return;
        }

        try {
            Files.list(itemRoot).filter(Files::isDirectory).forEach(itemDir -> {
                renameFolder(itemDir, OLD_THUMBNAIL, NEW_THUMBNAIL);
                renameFolder(itemDir, OLD_CONTENT, NEW_CONTENT);
            });
        } catch (IOException e) {
            log.warn("[ImageFolderMigration] 파일시스템 탐색 중 오류: {}", e.getMessage());
        }
    }

    private void renameFolder(Path parent, String oldName, String newName) {
        Path oldPath = parent.resolve(oldName);
        Path newPath = parent.resolve(newName);

        if (!Files.exists(oldPath)) {
            return;
        }
        if (Files.exists(newPath)) {
            try {
                Files.list(oldPath).forEach(file -> {
                    try {
                        Files.move(file, newPath.resolve(file.getFileName()), StandardCopyOption.REPLACE_EXISTING);
                    } catch (IOException e) {
                        log.warn("[ImageFolderMigration] 파일 이동 실패: {}", file, e);
                    }
                });
                Files.deleteIfExists(oldPath);
            } catch (IOException e) {
                log.warn("[ImageFolderMigration] 폴더 병합 실패: {}", oldPath, e);
            }
        } else {
            try {
                Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
                log.info("[ImageFolderMigration] 폴더 이름 변경: {} → {}", oldPath, newPath);
            } catch (IOException e) {
                log.warn("[ImageFolderMigration] 폴더 이름 변경 실패: {}", oldPath, e);
            }
        }
    }
}
