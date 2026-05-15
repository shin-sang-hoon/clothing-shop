export default function Sparkline({ history }: { history: number[] }) {
    if (history.length < 2) return null;
    const W = 280, H = 60, pad = 4;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const pts = history
        .map((v, i) => {
            const x = pad + (i / (history.length - 1)) * (W - pad * 2);
            const y = H - pad - ((v - min) / range) * (H - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
            <polyline points={pts} fill="none" stroke="#e65c00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}
