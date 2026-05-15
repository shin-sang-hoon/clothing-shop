import { useState } from "react";
import { apiPlaceSellBid, type ItemOptionResponse } from "@/shared/api/tradeApi";
import { apiGetOrCreateTradeRoom } from "@/shared/api/chatApi";
import { useModalStore } from "@/shared/store/modalStore";
import { useNotificationStore } from "@/shared/store/notificationStore";
import styles from "./BuyBidModal.module.css";

interface Props {
    itemId: number;
    itemName: string;
    options: ItemOptionResponse[];
    selectedOptionId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SellBidModal({ itemId, itemName, options, selectedOptionId, onClose, onSuccess }: Props) {
    const [price, setPrice] = useState("");
    const [optionId, setOptionId] = useState<number | null>(selectedOptionId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const openAlert = useModalStore((state) => state.openAlert);
    const pushNotification = useNotificationStore((state) => state.push);

    async function handleMatchedTrade(result: { tradeId: number | null }) {
        pushNotification({
            type: "matched",
            title: "거래 체결 완료!",
            message: "판매 입찰이 체결되었습니다. 구매자와의 채팅이 생성됩니다.",
            tradeId: result.tradeId,
        });
        if (result.tradeId) {
            try {
                const room = await apiGetOrCreateTradeRoom(result.tradeId);
                pushNotification({
                    type: "matched",
                    title: "채팅방 생성됨",
                    message: "구매자와의 1:1 채팅방이 생성되었습니다. 채팅 메뉴에서 확인하세요.",
                    tradeId: result.tradeId,
                    tradeRoomId: room.id,
                });
            } catch {
                // 채팅방 생성 실패는 무시
            }
        }
    }

    const hasOptions = options.length > 0;

    function validateForm(): number | null {
        if (hasOptions && optionId === null) {
            setError("사이즈를 선택해주세요.");
            return null;
        }
        const priceNum = parseInt(price, 10);
        if (!priceNum || priceNum < 1) {
            setError("올바른 금액을 입력해주세요.");
            return null;
        }
        return priceNum;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const priceNum = validateForm();
        if (priceNum === null) return;

        setLoading(true);
        setError("");
        try {
            const result = await apiPlaceSellBid(itemId, priceNum, optionId);
            if (result.result === "MATCHED") {
                openAlert("success", "거래 체결!", result.message);
                await handleMatchedTrade(result);
            } else {
                pushNotification({ type: "bid", title: "판매 입찰 등록", message: "입찰이 등록되었습니다. 구매자 입찰가와 일치하면 자동 체결됩니다." });
                openAlert("success", "입찰 처리", result.message);
            }
            if (result.result === "MATCHED" || result.result === "BID_PLACED") {
                onSuccess();
                onClose();
            }
        } catch (err: unknown) {
            const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            const msg = axiosMsg ?? (err instanceof Error ? err.message : "입찰 중 오류가 발생했습니다.");
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>판매 입찰</h2>
                <div style={{ fontSize: "13px", color: "#555" }}>{itemName}</div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {hasOptions && (
                        <div>
                            <div className={styles.label}>사이즈 <span style={{ color: "#e65c00" }}>*</span></div>
                            <select
                                className={styles.select}
                                value={optionId ?? ""}
                                onChange={(e) => setOptionId(e.target.value ? Number(e.target.value) : null)}
                                required
                            >
                                <option value="">사이즈를 선택하세요</option>
                                {options.map((o) => (
                                    <option key={o.id} value={o.id}>{o.optionValue}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <div className={styles.label}>입찰 금액 (원)</div>
                        <input
                            className={styles.input}
                            type="number"
                            min={1}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="금액을 입력하세요"
                        />
                    </div>

                    <p className={styles.noteText}>입찰 금액이 구매 입찰가와 동일하면 즉시 체결됩니다.</p>

                    {error && <p className={styles.errorText}>{error}</p>}

                    <div className={styles.btnRow}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>취소</button>
                        <button type="submit" className={styles.btnSubmit} disabled={loading}>
                            {loading ? "처리 중..." : "입찰하기"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
