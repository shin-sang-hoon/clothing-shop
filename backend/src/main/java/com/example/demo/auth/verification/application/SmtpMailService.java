package com.example.demo.auth.verification.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * SmtpMailService
 * - SMTP 방식 메일 발송 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmtpMailService {

    private final JavaMailSender javaMailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    /**
     * 공통 메일 발송
     */
    public void sendMail(String to, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);

        javaMailSender.send(message);

        log.info("SMTP 메일 발송 완료. to={}", to);
    }
}