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

    const LevelRow = ({ label, value, colorClass, borderClass }: { label: string, value: number, colorClass: string, borderClass?: string }) => (
        <div className={`flex items-center justify-between p-1 rounded-[1px] bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] hover:border-[var(--color-flare)]/20 transition-all duration-300 group ${borderClass}`}>
            <div className="flex items-center gap-3">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-[1px] ${colorClass} bg-opacity-10 border border-current min-w-[32px] text-center italic tracking-widest`}>
                    {label}
                </span>
                <span className="text-xs font-mono font-bold text-white tracking-widest">{value > 0 ? value.toFixed(2) : '--'}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className={`h-[1px] w-8 bg-current opacity-20 group-hover:w-12 transition-all duration-500`}></div>
                <span className={`text-[10px] font-mono font-black ${getDistancePercent(value) > 0 ? 'text-[var(--color-long)]' : 'text-[var(--color-short)]'}`}>
                    {value > 0 ? (getDistancePercent(value) > 0 ? '+' : '') : ''}{value > 0 ? getDistancePercent(value).toFixed(2) : '--'}%
                </span>
            </div>
        </div>
    );

    return (
        <div className="card flare-border reveal shadow-2xl shadow-black/40">
            <div className="card-header border-b border-[var(--color-border)] pb-1.5 mb-2">
                <div className="flex items-center gap-3">
                    <Layers size={14} className="text-[var(--color-flare)]" />
                    <span className="font-black tracking-[0.2em] uppercase text-xs">Pivot Core Levels [{activeTimeframe === '60' ? '1H' : activeTimeframe === '240' ? '4H' : activeTimeframe + 'm'}]</span>
                </div>
                <Anchor size={12} className="text-[var(--color-flare)] opacity-30 animate-pulse" />
            </div>

            <div className="space-y-2">
                <LevelRow label="R3" value={r3} colorClass="text-[var(--color-short)]" />
                <LevelRow label="R2" value={r2} colorClass="text-[var(--color-short)] opacity-80" />
                <LevelRow label="R1" value={r1} colorClass="text-[var(--color-short)] opacity-60" />

                <div className="py-0.5 flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[var(--color-flare)] opacity-20"></div>
                    <span className="text-[8px] font-black text-[var(--color-flare)] uppercase tracking-[0.4em] italic px-1">Pivot</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[var(--color-flare)] opacity-20"></div>
                </div>

                <LevelRow label="PP" value={p} colorClass="text-[var(--color-flare)]" borderClass="border-[var(--color-flare)]/20 bg-[var(--color-flare)]/5" />

                <LevelRow label="S1" value={s1} colorClass="text-[var(--color-long)] opacity-60" />
                <LevelRow label="S2" value={s2} colorClass="text-[var(--color-long)] opacity-80" />
                <LevelRow label="S3" value={s3} colorClass="text-[var(--color-long)]" />
            </div>

            <div className="mt-2 flex flex-col gap-1.5 p-2 border border-[var(--color-border)] rounded-[1px] bg-black/20">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] px-1 opacity-60 italic">
                    <span className="text-[var(--color-silver)]">Engine Price</span>
                    <span className="text-white font-mono text-xs">${currentPrice > 0 ? currentPrice.toFixed(2) : '--'}</span>
                </div>
                <div className="h-[2px] w-full bg-white/5 relative overflow-hidden flex border-x border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-short)] via-[var(--color-flare)] to-[var(--color-long)] opacity-20"></div>
                    {currentPrice > 0 && r3 > s3 && (
                        <div
                            className="h-full bg-[var(--color-flare)] shadow-[0_0_10px_var(--color-flare)] transition-all duration-1000 relative"
                            style={{
                                width: `${Math.min(100, Math.max(0, ((currentPrice - s3) / (r3 - s3)) * 100))}%`
                            }}
                        >
                            <div className="absolute right-0 top-[-4px] w-[1px] h-[10px] bg-white"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
