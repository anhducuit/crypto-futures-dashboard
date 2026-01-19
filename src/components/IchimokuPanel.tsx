import { Cloud, Zap } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface IchimokuPanelProps {
    data: MAAnalysis | null;
    activeTimeframe: string;
}

export function IchimokuPanel({ data, activeTimeframe }: IchimokuPanelProps) {
    const tfData = data?.timeframes.find(t => t.timeframe === activeTimeframe);
    const ichimoku = tfData?.ichimoku;

    if (!ichimoku) return null;

    const { tenkan, kijun, spanA, spanB } = ichimoku;
    const price = tfData?.currentPrice || 0;
    const isAboveCloud = price > spanA && price > spanB;
    const isBelowCloud = price < spanA && price < spanB;

    const getStatusColor = () => {
        if (isAboveCloud) return 'text-green-500';
        if (isBelowCloud) return 'text-red-500';
        return 'text-yellow-500';
    };

    const getStatusText = () => {
        if (isAboveCloud) return 'GIÁ TRÊN MÂY (BULLISH)';
        if (isBelowCloud) return 'GIÁ DƯỚI MÂY (BEARISH)';
        return 'GIÁ TRONG MÂY (SIDEWAYS)';
    };

    return (
        <div className="card bg-gradient-to-br from-[var(--color-bg-secondary)] to-[#1a1a2e] border-[var(--color-border)] overflow-hidden">
            <div className="card-header flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <Cloud size={18} className="text-blue-400" />
                    <span className="font-bold tracking-wider">ICHIMOKU CLOUD</span>
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 ${getStatusColor()}`}>
                    {getStatusText()}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[var(--color-text-secondary)] mb-1 uppercase font-semibold">Tenkan-Sen (9)</span>
                    <span className={`text-sm font-mono ${tenkan > kijun ? 'text-green-400' : 'text-red-400'}`}>
                        {tenkan.toFixed(2)}
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[var(--color-text-secondary)] mb-1 uppercase font-semibold">Kijun-Sen (26)</span>
                    <span className="text-sm font-mono text-blue-400">
                        {kijun.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${spanA > spanB ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-[var(--color-text-secondary)]">Senkou Span A</span>
                    </div>
                    <span className="text-xs font-mono">{spanA.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${spanB > spanA ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-xs text-[var(--color-text-secondary)]">Senkou Span B</span>
                    </div>
                    <span className="text-xs font-mono">{spanB.toFixed(2)}</span>
                </div>
            </div>

            {/* Cloud Status Indicator */}
            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-secondary)]">Tín hiệu giao cắt:</span>
                    {tenkan > kijun ? (
                        <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                            <Zap size={12} /> GOLDEN CROSS
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                            <Zap size={12} /> DEAD CROSS
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
