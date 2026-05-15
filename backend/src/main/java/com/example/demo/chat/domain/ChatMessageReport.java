package com.example.demo.chat.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message_report", indexes = {
        @Index(name = "idx_report_message_id", columnList = "message_id"),
        @Index(name = "idx_report_status",     columnList = "status")
})
@Getter
@Setter
public class ChatMessageReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", nullable = false)
    private Long messageId;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "reporter_email", nullable = false, length = 200)
    private String reporterEmail;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "sender_name", length = 100)
    private String senderName;

    @Column(name = "message_content", length = 2000)
    private String messageContent;

    @Column(name = "reason", length = 500)
    private String reason;

    /** PENDING | HANDLED | DISMISSED */
    @Column(name = "status", length = 20, nullable = false)
    private String status = "PENDING";

    @Column(name = "handled_note", length = 500)
    private String handledNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
