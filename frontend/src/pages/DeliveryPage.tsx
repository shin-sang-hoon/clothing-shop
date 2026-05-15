import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Client, type IMessage } from "@stomp/stompjs";
import styles from "./DeliveryPage.module.css";
import { apiGetDelivery, type DeliveryResponse } from "@/shared/api/deliveryApi";
import { BACKEND_ORIGIN } from "@/shared/config/env";

const COURIER_LINKS: Record<string, string> = {
  "CJ대한통운": "https://trace.cjlogistics.com/web/detail.jsp?slipno=",
  "한진택배": "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumList=",
  "롯데택배": "https://www.lotteglogis.com/open/tracking?invno=",
  "우체국택배": "https://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE=",
  "로젠택배": "https://www.ilogen.com/m/personal/trace/",
};

const DELIVERY_STATUS_STEPS = ["READY", "SHIPPING", "DELIVERED"];
const DELIVERY_STATUS_LABELS: Record<string, string> = {
  READY: "상품 준비",
  SHIPPING: "상품 이동중",
  DELIVERED: "상품 도착",
};

function getRentalSteps(deliveryStatus: string | null): { label: string; done: boolean }[] {
  const currentIdx = DELIVERY_STATUS_STEPS.indexOf(deliveryStatus ?? "");
  return DELIVERY_STATUS_STEPS.map((s, i) => ({
    label: DELIVERY_STATUS_LABELS[s],
    done: currentIdx >= i,
  }));
}

export default function DeliveryPage() {
  const [searchParams] = useSearchParams();
  const [orderNo, setOrderNo] = useState(searchParams.get("orderNo") ?? "");
  const [result, setResult] = useState<DeliveryResponse | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const stompRef = useRef<Client | null>(null);

  const [isTradeOrder, setIsTradeOrder] = useState(false);

  async function handleSearch(no?: string) {
    const trimmed = (no ?? orderNo).trim();
    if (!trimmed) return;
    setResult(null);
    setNotFound(false);
    setNotReady(false);
    setIsTradeOrder(false);
    setDeliveryStatus(null);

    // 입찰 주문번호(T 시작)는 배송 조회 미지원
    if (trimmed.toUpperCase().startsWith("T")) {
      setIsTradeOrder(true);
      return;
    }

    setLoading(true);
    try {
      const data = await apiGetDelivery(trimmed);
      setResult(data);
      setDeliveryStatus(data.deliveryStatus);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "";
      if (msg.includes("배송 조회가 불가")) {
        setNotReady(true);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  // Auto-search if orderNo from query param
  useEffect(() => {
    const no = searchParams.get("orderNo");
    if (no) {
      setOrderNo(no);
      handleSearch(no);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebSocket subscription for real-time delivery status
  useEffect(() => {
    if (!result || result.type !== "RENTAL") return;

    const wsUrl = BACKEND_ORIGIN
      .replace(/^https:\/\//, "wss://")
      .replace(/^http:\/\//, "ws://")
      + "/ws/websocket";

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/rental/delivery/${result.orderNo}`, (frame: IMessage) => {
          try {
            const status = frame.body.replace(/^"|"$/g, ""); // strip JSON string quotes
            setDeliveryStatus(status);
          } catch {
            // ignore
          }
        });
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [result]);

  const steps = result ? getRentalSteps(deliveryStatus) : [];
  const lastDoneIndex = steps.reduce((acc, s, i) => (s.done ? i : acc), -1);
  const courierLink =
    result?.courier && result.trackingNumber ? (COURIER_LINKS[result.courier] ?? null) : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>배송 조회</h1>
        <p className={styles.desc}>
          렌탈 주문번호를 입력하여 배송 현황을 확인하세요.
          <br />
          <span style={{ fontSize: 12, color: "#999" }}>
            렌탈 주문번호: R로 시작 &nbsp;|&nbsp; 배송 조회는 <strong>렌탈 주문만</strong> 지원됩니다.
          </span>
          <br />
          <span style={{ fontSize: 12, color: "#999" }}>
            입찰 거래의 경우 판매자와 구매자 간의 <strong>1:1 채팅</strong>을 통해 판매자가 구매자에게 직접 운송장 번호를 전달해 드립니다.
          </span>
        </p>

        <div className={styles.searchBox}>
          <input
            className={styles.input}
            placeholder="렌탈 주문번호 입력 (예: R20260101XXXXXXXX)"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
          <button className={styles.btnSearch} onClick={() => handleSearch()} disabled={loading}>
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>

        {isTradeOrder && (
          <div className={styles.notFound} style={{ background: "#f0f9ff", color: "#0369a1", borderColor: "#bae6fd" }}>
            입찰 거래는 배송 조회가 지원되지 않습니다. 판매자와 1:1 채팅을 통해 운송장 번호를 직접 확인해주세요.
          </div>
        )}

        {notReady && (
          <div className={styles.notFound} style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" }}>
            아직 배송 조회가 불가한 주문입니다. 관리자가 상품을 준비하면 조회할 수 있습니다.
          </div>
        )}

        {notFound && (
          <div className={styles.notFound}>
            해당 주문번호를 찾을 수 없습니다. 주문번호를 다시 확인해주세요.
          </div>
        )}

        {result && (
          <div className={styles.resultCard}>
            <div style={{ marginBottom: 16 }}>
              <span style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 20,
                background: result.type === "RENTAL" ? "#e0f2fe" : "#fef3c7",
                color: result.type === "RENTAL" ? "#0369a1" : "#b45309",
                fontSize: 12,
                fontWeight: 700,
              }}>
                {result.type === "RENTAL" ? "렌탈" : "입찰거래"}
              </span>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>주문번호</span>
                <span className={styles.infoValue}>{result.orderNo}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>상품명</span>
                <span className={styles.infoValue}>{result.itemName ?? "-"}</span>
              </div>
              {result.optionValue && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>옵션</span>
                  <span className={styles.infoValue}>{result.optionValue}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>택배사</span>
                <span className={styles.infoValue}>{result.courier ?? "미등록"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>운송장 번호</span>
                <span className={styles.infoValue}>
                  {result.trackingNumber
                    ? courierLink
                      ? <a href={`${courierLink}${result.trackingNumber}`} target="_blank" rel="noopener noreferrer" style={{ color: "#111", textDecoration: "underline" }}>{result.trackingNumber}</a>
                      : result.trackingNumber
                    : "미등록"}
                </span>
              </div>
              {result.receiverName && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>수령인</span>
                  <span className={styles.infoValue}>{result.receiverName}</span>
                </div>
              )}
              {result.roadAddress && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>배송지</span>
                  <span className={styles.infoValue}>
                    {result.roadAddress}{result.detailAddress ? ` ${result.detailAddress}` : ""}
                  </span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>현재 상태</span>
                <span className={`${styles.infoValue} ${styles.statusBadge}`}>{result.status}</span>
              </div>
            </div>

            <div className={styles.timelineTitle}>진행 현황</div>
            <div className={styles.timeline}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`${styles.timelineItem} ${i === lastDoneIndex ? styles.timelineCurrent : ""} ${!step.done ? styles.timelinePending : ""}`}
                >
                  <div className={styles.timelineDot} />
                  {i < steps.length - 1 && <div className={styles.timelineLine} />}
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineStatus}>{step.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {courierLink && result.trackingNumber && (
              <a
                href={`${courierLink}${result.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  marginTop: 20,
                  textAlign: "center",
                  padding: "10px",
                  background: "#111",
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {result.courier} 실시간 조회 →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
