import { create } from "zustand";

/**
 * 공통 모달 아이콘/의미 타입
 */
export type ModalType = "success" | "warning" | "error";

/**
 * 공통 모달 동작 타입
 * - alert: 확인 버튼 1개
 * - confirm: 확인 / 취소 버튼 2개
 */
export type ModalActionType = "alert" | "confirm";

/**
 * ModalState
 * - 전역 공통 모달 상태
 */
interface ModalState {
    isOpen: boolean;
    type: ModalType;
    actionType: ModalActionType;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    closeOnOverlay: boolean;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;

    /**
     * openModal
     * - 기존 호출부 호환용 alert 오픈 함수
     */
    openModal: (
        type: ModalType,
        title: string,
        message: string,
        confirmText?: string,
        onConfirm?: (() => void) | null,
    ) => void;

    /**
     * openAlert
     * - 확인 버튼 1개짜리 모달
     */
    openAlert: (
        type: ModalType,
        title: string,
        message: string,
        confirmText?: string,
        onConfirm?: (() => void) | null,
        closeOnOverlay?: boolean,
    ) => void;

    /**
     * openConfirm
     * - 확인 / 취소 버튼 2개짜리 모달
     */
    openConfirm: (
        type: ModalType,
        title: string,
        message: string,
        onConfirm: () => void,
        confirmText?: string,
        cancelText?: string,
        onCancel?: (() => void) | null,
        closeOnOverlay?: boolean,
    ) => void;

    /**
     * confirmModal
     * - 확인 버튼 클릭 처리
     */
    confirmModal: () => void;

    /**
     * cancelModal
     * - 취소 버튼 / 오버레이 닫기 처리
     */
    cancelModal: () => void;

    /**
     * closeModal
     * - 콜백 실행 없이 강제 종료
     */
    closeModal: () => void;
}

/**
 * 빈 모달 기본값
 */
const INITIAL_MODAL_STATE = {
    isOpen: false,
    type: "success" as ModalType,
    actionType: "alert" as ModalActionType,
    title: "",
    message: "",
    confirmText: "확인",
    cancelText: "취소",
    closeOnOverlay: true,
    onConfirm: null,
    onCancel: null,
};

/**
 * resetModalState
 * - 모달 상태 초기화 공용 함수
 */
function resetModalState() {
    return {
        ...INITIAL_MODAL_STATE,
    };
}

/**
 * modalStore
 * - 사용자 / 관리자 공통 전역 모달 상태 관리
 */
export const useModalStore = create<ModalState>((set, get) => ({
    ...INITIAL_MODAL_STATE,

    openModal: (type, title, message, confirmText = "확인", onConfirm = null) =>
        set({
            isOpen: true,
            type,
            actionType: "alert",
            title,
            message,
            confirmText,
            cancelText: "취소",
            closeOnOverlay: true,
            onConfirm,
            onCancel: null,
        }),

    openAlert: (
        type,
        title,
        message,
        confirmText = "확인",
        onConfirm = null,
        closeOnOverlay = true,
    ) =>
        set({
            isOpen: true,
            type,
            actionType: "alert",
            title,
            message,
            confirmText,
            cancelText: "취소",
            closeOnOverlay,
            onConfirm,
            onCancel: null,
        }),

    openConfirm: (
        type,
        title,
        message,
        onConfirm,
        confirmText = "확인",
        cancelText = "취소",
        onCancel = null,
        closeOnOverlay = false,
    ) =>
        set({
            isOpen: true,
            type,
            actionType: "confirm",
            title,
            message,
            confirmText,
            cancelText,
            closeOnOverlay,
            onConfirm,
            onCancel,
        }),

    confirmModal: () => {
        const confirmAction = get().onConfirm;

        set(resetModalState());

        if (confirmAction) {
            confirmAction();
        }
    },

    cancelModal: () => {
        const cancelAction = get().onCancel;

        set(resetModalState());

        if (cancelAction) {
            cancelAction();
        }
    },

    closeModal: () => {
        set(resetModalState());
    },
}));