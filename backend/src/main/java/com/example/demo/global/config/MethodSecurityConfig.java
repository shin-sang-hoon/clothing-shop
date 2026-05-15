package com.example.demo.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * MethodSecurityConfig
 * - @PreAuthorize 활성화
 */
@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig {
}