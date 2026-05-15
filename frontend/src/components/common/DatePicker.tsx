import { useEffect, useRef, useState } from "react";
import styles from "./DatePicker.module.css";

interface DatePickerProps {
    value: string;           // YYYY-MM-DD
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parseYMD(dateStr: string): { y: number; m: number; d: number } | null {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return { y, m, d };
}

function toDateStr(y: number, m: number, d: number): string {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getDaysInMonth(y: number, m: number): number {
    return new Date(y, m, 0).getDate();
}

function getFirstWeekday(y: number, m: number): number {
    return new Date(y, m - 1, 1).getDay();
}

export default function DatePicker({ value, onChange, placeholder = "날짜 선택", className }: DatePickerProps) {
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth() + 1;
    const todayD = today.getDate();

    const parsed = parseYMD(value);

    const [open, setOpen] = useState(false);
    const [viewY, setViewY] = useState(parsed?.y ?? todayY);
    const [viewM, setViewM] = useState(parsed?.m ?? todayM);

    const ref = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 닫기
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // value 바뀌면 뷰 동기화
    useEffect(() => {
        if (parsed) {
            setViewY(parsed.y);
            setViewM(parsed.m);
        }
    }, [value]);

    function prevMonth() {
        if (viewM === 1) { setViewY((y) => y - 1); setViewM(12); }
        else setViewM((m) => m - 1);
    }

    function nextMonth() {
        if (viewM === 12) { setViewY((y) => y + 1); setViewM(1); }
        else setViewM((m) => m + 1);
    }

    function selectDay(d: number) {
        onChange(toDateStr(viewY, viewM, d));
        setOpen(false);
    }

    // 달력 셀 배열 생성
    const firstWd = getFirstWeekday(viewY, viewM);
    const daysInCur = getDaysInMonth(viewY, viewM);
    const prevM = viewM === 1 ? 12 : viewM - 1;
    const prevY = viewM === 1 ? viewY - 1 : viewY;
    const daysInPrev = getDaysInMonth(prevY, prevM);

    type Cell = { d: number; type: "prev" | "cur" | "next" };
    const cells: Cell[] = [];

    // 이전 달 잔여 일수
    for (let i = firstWd - 1; i >= 0; i--) {
        cells.push({ d: daysInPrev - i, type: "prev" });
    }
    // 현재 달
    for (let d = 1; d <= daysInCur; d++) {
        cells.push({ d, type: "cur" });
    }
    // 다음 달 채우기 (6행 = 42칸)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
        cells.push({ d, type: "next" });
    }

    const displayValue = parsed
        ? `${parsed.y}. ${String(parsed.m).padStart(2, "0")}. ${String(parsed.d).padStart(2, "0")}`
        : "";

    return (
        <div className={`${styles.wrapper} ${className ?? ""}`} ref={ref}>
            {/* 트리거 인풋 */}
            <div
                className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
                onClick={() => setOpen((o) => !o)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
            >
                <span className={displayValue ? styles.triggerValue : styles.triggerPlaceholder}>
                    {displayValue || placeholder}
                </span>
                <svg className={styles.calIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>

            {/* 달력 드롭다운 */}
            {open && (
                <div className={styles.calendar}>
                    {/* 헤더 */}
                    <div className={styles.calHeader}>
                        <button type="button" className={styles.navBtn} onClick={prevMonth}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <span className={styles.calTitle}>
                            {viewY}년 {viewM}월
                        </span>
                        <button type="button" className={styles.navBtn} onClick={nextMonth}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    {/* 요일 헤더 */}
                    <div className={styles.weekdays}>
                        {WEEKDAYS.map((w, i) => (
                            <div
                                key={w}
                                className={`${styles.weekday} ${i === 0 ? styles.sun : i === 6 ? styles.sat : ""}`}
                            >
                                {w}
                            </div>
                        ))}
                    </div>

                    {/* 날짜 그리드 */}
                    <div className={styles.grid}>
                        {cells.map((cell, idx) => {
                            const isToday = cell.type === "cur" && viewY === todayY && viewM === todayM && cell.d === todayD;
                            const isSelected = cell.type === "cur" && parsed?.y === viewY && parsed?.m === viewM && parsed?.d === cell.d;
                            const colIdx = idx % 7;
                            const isSun = colIdx === 0;
                            const isSat = colIdx === 6;

                            return (
                                <button
                                    key={`${cell.type}-${cell.d}-${idx}`}
                                    type="button"
                                    className={[
                                        styles.day,
                                        cell.type !== "cur" ? styles.dayOther : "",
                                        isToday && !isSelected ? styles.dayToday : "",
                                        isSelected ? styles.daySelected : "",
                                        isSun && cell.type === "cur" ? styles.daySun : "",
                                        isSat && cell.type === "cur" ? styles.daySat : "",
                                    ].filter(Boolean).join(" ")}
                                    onClick={() => cell.type === "cur" && selectDay(cell.d)}
                                    disabled={cell.type !== "cur"}
                                >
                                    {cell.d}
                                </button>
                            );
                        })}
                    </div>

                    {/* 하단: 오늘 버튼 */}
                    <div className={styles.calFooter}>
                        <button
                            type="button"
                            className={styles.todayBtn}
                            onClick={() => {
                                setViewY(todayY);
                                setViewM(todayM);
                                onChange(toDateStr(todayY, todayM, todayD));
                                setOpen(false);
                            }}
                        >
                            오늘
                        </button>
                        <button
                            type="button"
                            className={styles.clearBtn}
                            onClick={() => { onChange(""); setOpen(false); }}
                        >
                            초기화
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
