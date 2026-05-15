import { useEffect, useRef, useState } from "react";
import styles from "./AddressInput.module.css";

const KAKAO_POSTCODE_URL =
    "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

interface AddressValue {
    zipCode: string;
    roadAddress: string;
    detailAddress: string;
}

interface AddressInputProps {
    value: AddressValue;
    onChange: (value: AddressValue) => void;
    disabled?: boolean;
}

export type { AddressValue };

/**
 * AddressInput
 * - 카카오 우편번호 서비스를 이용한 주소 입력 컴포넌트
 * - zipCode, roadAddress, detailAddress 분리 저장
 */
export default function AddressInput({ value, onChange, disabled }: AddressInputProps) {
    const [zipCode, setZipCode] = useState(value.zipCode);
    const [roadAddress, setRoadAddress] = useState(value.roadAddress);
    const [detailAddress, setDetailAddress] = useState(value.detailAddress);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (isInitialized.current) return;
        if (!value.zipCode && !value.roadAddress) return;
        isInitialized.current = true;

        setZipCode(value.zipCode);
        setRoadAddress(value.roadAddress);
        setDetailAddress(value.detailAddress);
    }, [value]);

    /**
     * 카카오 우편번호 스크립트 동적 로드
     */
    function loadScript(): Promise<void> {
        return new Promise((resolve) => {
            if (window.daum?.Postcode) {
                resolve();
                return;
            }
            const existing = document.querySelector(
                `script[src="${KAKAO_POSTCODE_URL}"]`,
            );
            if (existing) {
                existing.addEventListener("load", () => resolve());
                return;
            }
            const script = document.createElement("script");
            script.src = KAKAO_POSTCODE_URL;
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    }

    /**
     * 주소 검색 팝업 열기
     */
    async function handleSearch() {
        await loadScript();

        new window.daum.Postcode({
            oncomplete: (data) => {
                const road = data.roadAddress || data.jibunAddress;
                const zone = data.zonecode;

                setZipCode(zone);
                setRoadAddress(road);
                setDetailAddress("");

                onChange({ zipCode: zone, roadAddress: road, detailAddress: "" });
            },
        }).open();
    }

    /**
     * 상세주소 변경
     */
    function handleDetailChange(e: React.ChangeEvent<HTMLInputElement>) {
        const detail = e.target.value;
        setDetailAddress(detail);
        onChange({ zipCode, roadAddress, detailAddress: detail });
    }

    return (
        <div className={styles.wrap}>
            {/* 우편번호 + 검색 버튼 */}
            <div className={styles.zipRow}>
                <input
                    className={styles.zipInput}
                    value={zipCode}
                    readOnly
                    placeholder="우편번호"
                    disabled={disabled}
                />
                <button
                    type="button"
                    className={styles.searchBtn}
                    onClick={handleSearch}
                    disabled={disabled}
                >
                    주소 검색
                </button>
            </div>

            {/* 기본 주소 (자동 입력) */}
            <input
                className={styles.addressInput}
                value={roadAddress}
                readOnly
                placeholder="기본 주소 (주소 검색 후 자동 입력)"
                disabled={disabled}
            />

            {/* 상세 주소 (직접 입력) */}
            <input
                className={styles.detailInput}
                value={detailAddress}
                onChange={handleDetailChange}
                placeholder="상세 주소 입력 (동, 호수, 층 등)"
                disabled={disabled || !roadAddress}
            />
        </div>
    );
}
