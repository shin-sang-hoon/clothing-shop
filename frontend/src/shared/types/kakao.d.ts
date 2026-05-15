/**
 * 카카오 우편번호 서비스 타입 선언
 * https://postcode.map.daum.net/guide
 */

interface DaumPostcodeData {
    /** 우편번호 (5자리) */
    zonecode: string;
    /** 도로명 주소 */
    roadAddress: string;
    /** 지번 주소 */
    jibunAddress: string;
    /** 도로명 주소 — 영문 */
    roadAddressEnglish: string;
    /** 건물명 */
    buildingName: string;
    /** 공동주택 여부 (Y/N) */
    apartment: string;
    /** 자동완성 도로명 주소 */
    autoRoadAddress: string;
    /** 자동완성 지번 주소 */
    autoJibunAddress: string;
}

interface DaumPostcodeOptions {
    oncomplete: (data: DaumPostcodeData) => void;
    onclose?: (state: string) => void;
    width?: number | string;
    height?: number | string;
    animation?: boolean;
    focusInput?: HTMLInputElement;
}

interface DaumPostcodeInstance {
    open(): void;
    embed(element: HTMLElement, options?: { q?: string }): void;
}

interface DaumPostcodeConstructor {
    new (options: DaumPostcodeOptions): DaumPostcodeInstance;
}

interface Daum {
    Postcode: DaumPostcodeConstructor;
}

declare global {
    interface Window {
        daum: Daum;
    }
}

export {};
