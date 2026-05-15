package com.example.demo.chat.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageReportRepository extends JpaRepository<ChatMessageReport, Long> {
    List<ChatMessageReport> findAllByOrderByCreatedAtDesc();
    boolean existsByMessageIdAndReporterEmail(Long messageId, String reporterEmail);
}
