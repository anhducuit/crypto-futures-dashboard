import { Cloud, Zap } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface IchimokuPanelProps {
    data: MAAnalysis | null;
    activeTimeframe: string;
}

export function IchimokuPanel({ data, activeTimeframe }: IchimokuPanelProps) {
    const tfData = data?.timeframes.find(t => t.timeframe === activeTimeframe);
    const ichimoku = tfData?.ichimoku;

    const price = tfData?.currentPrice || 0;
    const { tenkan, kijun, spanA, spanB } = ichimoku || { tenkan: 0, kijun: 0, spanA: 0, spanB: 0 };

    const isAboveCloud = price > 0 && price > spanA && price > spanB;
    const isBelowCloud = price > 0 && price < spanA && price < spanB;

    const getStatusColor = () => {
        if (!ichimoku) return 'text-[var(--color-silver)] opacity-30';
        if (isAboveCloud) return 'text-[var(--color-long)]';
        if (isBelowCloud) return 'text-[var(--color-short)]';
        return 'text-[var(--color-flare)]';
    };

    const getStatusText = () => {
        if (!ichimoku) return 'INITIALIZING_CORE...';
        if (isAboveCloud) return 'ABOVE_CLOUD_BULL';
        if (isBelowCloud) return 'BELOW_CLOUD_BEAR';
        return 'INNER_CLOUD_NEUTRAL';
    };

    return (
        <div className="card flare-border reveal shadow-2xl shadow-black/40">
            <div className="card-header flex items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <Cloud size={14} className="text-[var(--color-flare)]" />
                    <span className="font-black tracking-[0.2em] uppercase text-xs">Ichimoku [Cloud] {activeTimeframe === '60' ? '1H' : activeTimeframe === '240' ? '4H' : activeTimeframe + 'm'}</span>
                </div>
                <div className={`text-[9px] font-black tracking-[0.2em] px-3 py-1 bg-white/5 border border-current italic ${getStatusColor()}`}>
                    {getStatusText()}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-[1px] bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex flex-col items-center justify-center group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-flare)] to-transparent opacity-20"></div>
                    <span className="text-[9px] text-[var(--color-silver)] mb-2 uppercase font-black tracking-widest opacity-40 text-center">Conversion (9)</span>
                    <span className={`text-xl font-mono font-black italic tracking-tighter ${tenkan > kijun ? 'text-[var(--color-long)]' : 'text-[var(--color-short)]'}`}>
                        {tenkan > 0 ? tenkan.toFixed(2) : '--'}
                    </span>
                </div>
                <div className="p-4 rounded-[1px] bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex flex-col items-center justify-center group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-flare)] to-transparent opacity-20"></div>
                    <span className="text-[9px] text-[var(--color-silver)] mb-2 uppercase font-black tracking-widest opacity-40 text-center">Base Line (26)</span>
                    <span className="text-xl font-mono font-black italic tracking-tighter text-white">
                        {kijun > 0 ? kijun.toFixed(2) : '--'}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-[1px] bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] group hover:border-[var(--color-flare)]/30 transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-[1px] ${spanA > spanB ? 'bg-[var(--color-long)]' : 'bg-[var(--color-short)]'} shadow-[0_0_8px_currentColor]`}></div>
                        <span className="text-[10px] text-[var(--color-silver)] font-black tracking-widest uppercase opacity-60">Span A [LEAD]</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-white tracking-wider">{spanA > 0 ? spanA.toFixed(2) : '--'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-[1px] bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] group hover:border-[var(--color-flare)]/30 transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-[1px] ${spanB > spanA ? 'bg-[var(--color-short)]' : 'bg-[var(--color-long)]'} shadow-[0_0_8px_currentColor]`}></div>
                        <span className="text-[10px] text-[var(--color-silver)] font-black tracking-widest uppercase opacity-60">Span B [ANCHOR]</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-white tracking-wider">{spanB > 0 ? spanB.toFixed(2) : '--'}</span>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--color-silver)] uppercase font-black tracking-[0.2em] opacity-40 italic">Signal Divergence:</span>
                    {tenkan === 0 ? (
                        <span className="text-[10px] text-gray-500 tracking-tighter">WAITING_SYNC</span>
                    ) : tenkan > kijun ? (
                        <div className="flex items-center gap-2 text-[var(--color-long)] text-[10px] font-black italic tracking-widest animate-pulse">
                            <Zap size={12} fill="currentColor" /> ALPHA_CROSS_UP
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-[var(--color-short)] text-[10px] font-black italic tracking-widest animate-pulse">
                            <Zap size={12} fill="currentColor" /> ALPHA_CROSS_DOWN
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
