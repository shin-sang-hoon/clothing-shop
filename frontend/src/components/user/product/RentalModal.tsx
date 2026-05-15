import { useState, useEffect } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { useAuthStore } from "@/shared/store/authStore";
import {
  apiVerifyAndCreateRental,
  apiGetRentalAvailability,
  type RentalAvailabilityResponse,
} from "@/shared/api/rentalApi";
import { useNotificationStore } from "@/shared/store/notificationStore";
import styles from "./RentalModal.module.css";

const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID as string;
const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY as string;

interface Props {
  itemId: number;
  itemName: string;
  rentalPrice: number;
  onClose: () => void;
  onSuccess?: () => void;
}

// ── 날짜 유틸 ────────────────────────────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
// ── 캘린더 컴포넌트 ───────────────────────────────────────────────────────────
function RangePicker({
  startDate,
  endDate,
  onSelect,
}: {
  startDate: Date | null;
  endDate: Date | null;
  onSelect: (d: Date) => void;
}) {
  const todayDate = today();
  const minDate = addDays(todayDate, 1); // 내일부터

  const [viewYear, setViewYear] = useState(() => minDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => minDate.getMonth());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  // 이번 달 날짜 배열 (앞에 빈 칸 포함)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  // 범위 강조 판정
  function inRange(d: Date) {
    if (!startDate) return false;
    const end = endDate ?? hoverDate;
    if (!end) return false;
    const lo = startDate <= end ? startDate : end;
    const hi = startDate <= end ? end : startDate;
    return d > lo && d < hi;
  }
  function isStart(d: Date) { return startDate ? isSameDay(d, startDate) : false; }
  function isEnd(d: Date) {
    const end = endDate ?? (hoverDate && startDate && !endDate ? hoverDate : null);
    return end ? isSameDay(d, end) : false;
  }

  return (
    <div className={styles.calendar}>
      {/* 헤더 */}
      <div className={styles.calHeader}>
        <button type="button" className={styles.calNavBtn} onClick={prevMonth}>‹</button>
        <span className={styles.calTitle}>{viewYear}년 {viewMonth + 1}월</span>
        <button type="button" className={styles.calNavBtn} onClick={nextMonth}>›</button>
      </div>

      {/* 요일 */}
      <div className={styles.calGrid}>
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`${styles.calWeekday} ${i === 0 ? styles.calSun : ""} ${i === 6 ? styles.calSat : ""}`}
          >
            {w}
          </div>
        ))}

        {/* 날짜 셀 */}
        {cells.map((d, idx) => {
          if (!d) return <div key={`empty-${idx}`} />;
          const disabled = d < minDate;
          const start = isStart(d);
          const end = isEnd(d);
          const range = inRange(d);
          const isSun = d.getDay() === 0;
          const isSat = d.getDay() === 6;
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={disabled}
              className={[
                styles.calDay,
                disabled ? styles.calDayDisabled : "",
                start ? styles.calDayStart : "",
                end && !isSameDay(d, startDate!) ? styles.calDayEnd : "",
                start && end ? styles.calDayStartEnd : "",
                range ? styles.calDayRange : "",
                isSun && !disabled ? styles.calSun : "",
                isSat && !disabled ? styles.calSat : "",
              ].join(" ")}
              onClick={() => !disabled && onSelect(d)}
              onMouseEnter={() => !disabled && setHoverDate(d)}
              onMouseLeave={() => setHoverDate(null)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 메인 모달 ─────────────────────────────────────────────────────────────────
export default function RentalModal({ itemId, itemName, rentalPrice, onClose, onSuccess }: Props) {
  const { me } = useAuthStore();
  const todayDate = today();
  const minDate = addDays(todayDate, 1);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [options, setOptions] = useState<RentalAvailabilityResponse[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [receiverName, setReceiverName] = useState(me?.name ?? "");
  const [receiverPhone, setReceiverPhone] = useState(me?.phoneNumber ?? "");
  const [roadAddress, setRoadAddress] = useState(me?.roadAddress ?? "");
  const [detailAddress, setDetailAddress] = useState(me?.detailAddress ?? "");
  const [zipCode, setZipCode] = useState(me?.zipCode ?? "");
  const [loading, setLoading] = useState(false);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [error, setError] = useState("");
  const pushNotification = useNotificationStore((state) => state.push);

  // me가 나중에 로드되는 경우를 대비해 동기화
  useEffect(() => {
    if (me?.phoneNumber) setReceiverPhone(me.phoneNumber);
    if (me?.name) setReceiverName(me.name);
    if (me?.roadAddress) setRoadAddress(me.roadAddress);
    if (me?.detailAddress) setDetailAddress(me.detailAddress);
    if (me?.zipCode) setZipCode(me.zipCode);
  }, [me]);

  // 날짜 클릭 핸들러: 시작일 → 종료일 순서로 선택
  function handleDaySelect(d: Date) {
    if (!startDate || (startDate && endDate)) {
      // 새로 선택 시작
      setStartDate(d);
      setEndDate(null);
    } else {
      // 두 번째 클릭
      if (d <= startDate) {
        setStartDate(d);
        setEndDate(null);
      } else {
        setEndDate(d);
      }
    }
  }

  const days = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const totalRental = rentalPrice * days;
  const deposit = days > 0 ? Math.max(Math.round(totalRental * 0.2), 10000) : 0;
  const totalAmount = totalRental + deposit;

  useEffect(() => {
    if (!startDate || !endDate) return;
    setCheckingAvail(true);
    apiGetRentalAvailability(itemId, formatDate(startDate), formatDate(endDate))
      .then((res) => { setOptions(res); setSelectedOptionId(null); })
      .catch(() => setOptions([]))
      .finally(() => setCheckingAvail(false));
  }, [itemId, startDate, endDate]);

  async function handleSubmit() {
    if (!startDate || !endDate) { setError("날짜를 선택해주세요."); return; }
    if (!receiverName || !receiverPhone) { setError("받는 분 이름과 전화번호를 입력해주세요."); return; }
    setLoading(true);
    setError("");

    try {
      const paymentId = `rental-${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      let payResponse: Awaited<ReturnType<typeof PortOne.requestPayment>>;
      try {
        payResponse = await PortOne.requestPayment({
          storeId: PORTONE_STORE_ID,
          channelKey: PORTONE_CHANNEL_KEY,
          paymentId,
          orderName: `렌탈 - ${itemName} (${days}일)`,
          totalAmount: totalAmount,
          currency: "CURRENCY_KRW",
          payMethod: "CARD",
          customer: {
            email: me?.email ?? "",
            fullName: me?.name ?? "",
            phoneNumber: me?.phoneNumber ?? "",
          },
        });
      } catch (portoneErr: unknown) {
        const msg = portoneErr instanceof Error ? portoneErr.message : "결제 모듈 오류가 발생했습니다.";
        setError(`결제 오류: ${msg}`);
        return;
      }

      if (payResponse?.code !== undefined) {
        setError(`결제 실패: ${payResponse.message ?? "알 수 없는 오류"}`);
        return;
      }

      const rental = await apiVerifyAndCreateRental({
        paymentId,
        itemId,
        itemOptionId: selectedOptionId ?? undefined,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        receiverName,
        receiverPhone,
        zipCode,
        roadAddress,
        detailAddress,
      });
      pushNotification({
        type: "rental",
        title: "렌탈 신청 완료!",
        message: `${rental.itemName ?? itemName} 렌탈이 신청되었습니다. 주문번호: ${rental.orderNo ?? ""}`,
      });
      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "렌탈 신청 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>렌탈 신청</span>
          <button className={styles.closeBtn} type="button" onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.itemName}>{itemName}</div>
          <div className={styles.pricePerDay}>{rentalPrice.toLocaleString()}원 / 일</div>

          {/* 날짜 선택 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>대여 기간</div>

            {/* 선택된 날짜 표시 */}
            <div className={styles.selectedRange}>
              <div className={`${styles.rangePill} ${startDate ? styles.rangePillActive : ""}`}>
                <span className={styles.rangeLabel}>시작</span>
                <span className={styles.rangeVal}>
                  {startDate ? formatDate(startDate) : "날짜 선택"}
                </span>
              </div>
              <span className={styles.rangeDash}>→</span>
              <div className={`${styles.rangePill} ${endDate ? styles.rangePillActive : ""}`}>
                <span className={styles.rangeLabel}>종료</span>
                <span className={styles.rangeVal}>
                  {endDate ? formatDate(endDate) : "날짜 선택"}
                </span>
              </div>
              {days > 0 && (
                <span className={styles.rangeDays}>{days}일</span>
              )}
            </div>

            {/* 캘린더 */}
            <RangePicker
              startDate={startDate}
              endDate={endDate}
              onSelect={handleDaySelect}
            />
          </div>

          {/* 옵션 선택 */}
          {options.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>사이즈 / 옵션 선택</div>
              {checkingAvail ? (
                <div className={styles.hint}>가용성 확인 중...</div>
              ) : (
                <div className={styles.optionGrid}>
                  {options.map((opt) => (
                    <button
                      key={opt.optionId}
                      type="button"
                      disabled={!opt.availableForDates}
                      className={`${styles.optionBtn} ${
                        selectedOptionId === opt.optionId ? styles.optionBtnActive : ""
                      } ${!opt.availableForDates ? styles.optionBtnDisabled : ""}`}
                      onClick={() => opt.availableForDates && setSelectedOptionId(opt.optionId)}
                    >
                      {opt.optionValue}
                      {!opt.availableForDates && (
                        <span className={styles.optionStatus}>
                          {opt.rentalStatus === "RENTING" ? " 대여중"
                            : opt.rentalStatus === "INSPECTING" ? " 검수중"
                            : " 세탁중"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 받는 분 정보 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>받는 분 정보</div>
            <input className={styles.input} placeholder="이름" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
            <input className={styles.input} placeholder="전화번호" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
            <input className={styles.input} placeholder="도로명 주소" value={roadAddress} onChange={(e) => setRoadAddress(e.target.value)} />
            <input className={styles.input} placeholder="상세 주소" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} />
          </div>

          {/* 금액 요약 */}
          {days > 0 && (
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>렌탈료 ({days}일)</span>
                <span>{totalRental.toLocaleString()}원</span>
              </div>
              <div className={styles.summaryRow}>
                <span>보증금 (20%)</span>
                <span>{deposit.toLocaleString()}원</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>합계</span>
                <span>{totalAmount.toLocaleString()}원</span>
              </div>
              <div className={styles.depositNote}>* 보증금은 반납 확인 후 환불됩니다.</div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} type="button" onClick={onClose}>취소</button>
          <button
            className={styles.submitBtn}
            type="button"
            disabled={loading || !startDate || !endDate}
            onClick={handleSubmit}
          >
            {loading ? "결제 중..." : "결제하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
