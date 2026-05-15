/**
 * timezone 포함 ISO 문자열인지 확인하는 정규식
 * - 예: 2026-03-12T01:01:00Z
 * - 예: 2026-03-12T10:01:00+09:00
 */
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;

/**
 * parseApiDateTime
 * - 백엔드가 내려준 시간을 Date 객체로 변환한다.
 * - timezone 정보가 없는 legacy LocalDateTime 문자열은 한국 시간(+09:00)으로 간주한다.
 */
function parseApiDateTime(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return null;
    }

    /**
     * timezone 정보가 이미 있으면 그대로 파싱한다.
     */
    if (TIMEZONE_SUFFIX_PATTERN.test(trimmedValue)) {
        const date = new Date(trimmedValue);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    /**
     * 기존 LocalDateTime 문자열은 한국 시간으로 간주한다.
     * 예: 2026-03-12T10:01:00.333795 -> 2026-03-12T10:01:00.333795+09:00
     */
    const normalizedValue = trimmedValue.replace(" ", "T");
    const date = new Date(`${normalizedValue}+09:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * formatDateTimeKst
 * - API 응답 시간을 한국 시간 기준 문자열로 포맷한다.
 * - 출력 형식: YYYY-MM-DD HH:mm
 */
export function formatDateTimeKst(value?: string | null): string {
    const date = parseApiDateTime(value);

    if (!date) {
        return value && value.trim() ? value : "-";
    }

    const formatter = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const partMap = new Map(parts.map((part) => [part.type, part.value]));

    const year = partMap.get("year") ?? "0000";
    const month = partMap.get("month") ?? "00";
    const day = partMap.get("day") ?? "00";
    const hour = partMap.get("hour") ?? "00";
    const minute = partMap.get("minute") ?? "00";

    return `${year}-${month}-${day} ${hour}:${minute}`;
}