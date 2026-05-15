package com.example.demo.trade.infra;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * PortOne V2 REST API 클라이언트
 * - API Secret을 Authorization 헤더에 직접 사용 (토큰 교환 불필요)
 * - 결제 단건 조회: GET https://api.portone.io/payments/{paymentId}
 */
@Component
public class PortOneClient {

    private static final String BASE_URL = "https://api.portone.io";

    private final RestClient restClient;

    public PortOneClient(@Value("${portone.api-secret}") String apiSecret) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(8000);

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(BASE_URL)
                .defaultHeader("Authorization", "PortOne " + apiSecret)
                .build();
    }

    /**
     * 결제 단건 조회
     * @param paymentId 프론트엔드가 생성한 paymentId
     * @return 결제 정보 (status, amount.total 등)
     */
    public PaymentResponse getPayment(String paymentId) {
        return restClient.get()
                .uri("/payments/{id}", paymentId)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    throw new IllegalStateException(
                            "포트원 결제 조회 실패 (HTTP " + resp.getStatusCode() + ")");
                })
                .body(PaymentResponse.class);
    }

    /**
     * 결제 취소(환불)
     * @param paymentId 취소할 결제 ID
     * @param reason    취소 사유
     */
    public void cancelPayment(String paymentId, String reason) {
        restClient.post()
                .uri("/payments/{id}/cancel", paymentId)
                .body(new CancelRequest(reason))
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    throw new IllegalStateException(
                            "포트원 결제 취소 실패 (HTTP " + resp.getStatusCode() + ")");
                })
                .toBodilessEntity();
    }

    // ─── Response records ────────────────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PaymentResponse(
            String paymentId,
            String status,       // PAID | FAILED | CANCELLED | PARTIAL_CANCELLED | READY | IN_PROGRESS
            AmountDetail amount
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AmountDetail(Long total, Long taxFree, Long vat) {}

    public record CancelRequest(String reason) {}
}
