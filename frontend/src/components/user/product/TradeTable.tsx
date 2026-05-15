import styles from "@/components/user/product/ProductDetail.module.css";
import type { TradeTab, TradeEntry } from "./productDetailTypes";

interface Props {
    entries: TradeEntry[];
    tab: TradeTab;
}

export default function TradeTable({ entries, tab }: Props) {
    if (tab === "concluded") {
        return (
            <table className={styles.tradeTable}>
                <thead><tr><th>옵션</th><th>거래가</th><th>거래일</th></tr></thead>
                <tbody>
                    {entries.map((r, i) => (
                        <tr key={i}>
                            <td>{r.size}</td>
                            <td className={styles.tradePrice}>{r.price.toLocaleString()}원</td>
                            <td className={styles.tradeDate}>{r.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
    if (tab === "sellBids") {
        return (
            <table className={styles.tradeTable}>
                <thead><tr><th>옵션</th><th>판매희망가</th><th>수량</th></tr></thead>
                <tbody>
                    {entries.map((r, i) => (
                        <tr key={i}>
                            <td>{r.size}</td>
                            <td className={styles.tradePrice}>{r.price.toLocaleString()}원</td>
                            <td>{r.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
    return (
        <table className={styles.tradeTable}>
            <thead><tr><th>옵션</th><th>구매희망가</th><th>수량</th></tr></thead>
            <tbody>
                {entries.map((r, i) => (
                    <tr key={i}>
                        <td>{r.size}</td>
                        <td className={styles.tradePriceBuy}>{r.price.toLocaleString()}원</td>
                        <td>{r.count}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
