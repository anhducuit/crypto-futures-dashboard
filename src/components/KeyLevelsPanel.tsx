import { Layers, Anchor } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface KeyLevelsPanelProps {
    data: MAAnalysis | null;
    activeTimeframe: string;
}

export function KeyLevelsPanel({ data, activeTimeframe }: KeyLevelsPanelProps) {
    const tfData = data?.timeframes.find(t => t.timeframe === activeTimeframe);
    const pivots = tfData?.pivots;
    const currentPrice = tfData?.currentPrice || 0;

    const { p, r1, r2, r3, s1, s2, s3 } = pivots || { p: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 };

    const getDistancePercent = (level: number) => {
        if (currentPrice === 0 || level === 0) return 0;
        return ((level - currentPrice) / currentPrice) * 100;
    };

    const LevelRow = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
            <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${colorClass} bg-opacity-20 min-w-[24px] text-center`}>
                    {label}
                </span>
                <span className="text-xs font-mono">{value > 0 ? value.toFixed(2) : '--'}</span>
            </div>
            <span className={`text-[10px] font-mono ${getDistancePercent(value) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {value > 0 ? (getDistancePercent(value) > 0 ? '+' : '') : ''}{value > 0 ? getDistancePercent(value).toFixed(2) : '--'}%
            </span>
        </div>
    );

    return (
        <div className="card bg-gradient-to-br from-[var(--color-bg-secondary)] to-[#1a1a2e] border-[var(--color-border)] overflow-hidden">
            <div className="card-header flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <Layers size={18} className="text-orange-400" />
                    <span className="font-bold tracking-wider uppercase text-xs">Vùng Cản Quan Trọng ({activeTimeframe === '60' ? '1H' : activeTimeframe === '240' ? '4H' : activeTimeframe + 'm'})</span>
                </div>
                <Anchor size={14} className="text-[var(--color-text-secondary)] opacity-50" />
            </div>

            <div className="space-y-1.5">
                <LevelRow label="R3" value={r3} colorClass="text-red-500 bg-red-500" />
                <LevelRow label="R2" value={r2} colorClass="text-red-500 bg-red-500" />
                <LevelRow label="R1" value={r1} colorClass="text-red-400 bg-red-400" />

                <div className="py-1 flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[var(--color-golden)]/30 to-transparent"></div>
                    <span className="text-[9px] font-black text-[var(--color-golden)] uppercase tracking-widest px-2">Điểm Xoay (Pivot)</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[var(--color-golden)]/30 to-transparent"></div>
                </div>

                <LevelRow label="PP" value={p} colorClass="text-[var(--color-golden)] bg-yellow-500" />

                <div className="h-1"></div>

                <LevelRow label="S1" value={s1} colorClass="text-green-400 bg-green-400" />
                <LevelRow label="S2" value={s2} colorClass="text-green-500 bg-green-500" />
                <LevelRow label="S3" value={s3} colorClass="text-green-500 bg-green-500" />
            </div>

            <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-secondary)] uppercase font-bold px-1">
                    <span>Giá Hiện Tại</span>
                    <span className="text-white font-mono">{currentPrice > 0 ? currentPrice.toFixed(2) : '--'}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                    {currentPrice > 0 && r3 > s3 && (
                        <div
                            className="h-full bg-gradient-to-r from-red-500 via-[var(--color-golden)] to-green-500 transition-all duration-1000"
                            style={{
                                width: `${Math.min(100, Math.max(0, ((currentPrice - s3) / (r3 - s3)) * 100))}%`
                            }}
                        ></div>
                    )}
                </div>
            </div>
        </div>
    );
}
