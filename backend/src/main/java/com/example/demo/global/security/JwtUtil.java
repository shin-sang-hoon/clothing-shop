package com.example.demo.global.security;

import com.example.demo.admin.role.domain.Role;
import com.example.demo.member.domain.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.stream.Collectors;

/**
 * JwtUtil (HS256)
 * - payload: sub(회원ID), email, roles, exp
 */
@Component
@RequiredArgsConstructor
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.access-minutes}")
    private long accessMinutes;

    public String createAccessToken(Member member) {
        long exp = Instant.now().plusSeconds(accessMinutes * 60).getEpochSecond();

        String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

        // ✅ roles를 DB 관계에서 가져와서 CSV로 구성
        String rolesCsv = "";
        if (member.getRoles() != null && !member.getRoles().isEmpty()) {
            rolesCsv = member.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.joining(","));
        }

        String payloadJson = "{"
                + "\"sub\":\"" + member.getId() + "\","
                + "\"email\":\"" + escape(member.getEmail()) + "\","
                + "\"exp\":" + exp
                + "}";

        String header = base64Url(headerJson.getBytes(StandardCharsets.UTF_8));
        String payload = base64Url(payloadJson.getBytes(StandardCharsets.UTF_8));

        String toSign = header + "." + payload;
        String sig = hmacSha256(toSign, secret);

        return toSign + "." + sig;
    }

    public JwtPayload verifyAndParse(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3)
            throw new IllegalArgumentException("Invalid JWT format");

        String header = parts[0];
        String payload = parts[1];
        String sig = parts[2];

        String toSign = header + "." + payload;
        String expected = hmacSha256(toSign, secret);
        if (!constantTimeEquals(expected, sig))
            throw new IllegalArgumentException("Invalid JWT signature");

        String payloadJson = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);

        String sub = readJsonString(payloadJson, "sub");
        String email = readJsonString(payloadJson, "email");
        String roles = readJsonString(payloadJson, "roles");
        long exp = readJsonLong(payloadJson, "exp");

        if (Instant.now().getEpochSecond() > exp)
            throw new IllegalArgumentException("JWT expired");

        return new JwtPayload(Long.parseLong(sub), email, roles);
    }

    public record JwtPayload(Long memberId, String email, String rolesCsv) {
    }

    // ---------- helpers ----------

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return base64Url(raw);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length())
            return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++)
            result |= a.charAt(i) ^ b.charAt(i);
        return result == 0;
    }

    private static String escape(String s) {
        if (s == null)
            return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String readJsonString(String json, String key) {
        String pat = "\"" + key + "\":\"";
        int start = json.indexOf(pat);
        if (start < 0)
            return "";
        start += pat.length();
        int end = json.indexOf("\"", start);
        if (end < 0)
            return "";
        return json.substring(start, end);
    }

    private static long readJsonLong(String json, String key) {
        String pat = "\"" + key + "\":";
        int start = json.indexOf(pat);
        if (start < 0)
            return 0;
        start += pat.length();
        int end = start;
        while (end < json.length() && Character.isDigit(json.charAt(end)))
            end++;
        return Long.parseLong(json.substring(start, end));
    }
}