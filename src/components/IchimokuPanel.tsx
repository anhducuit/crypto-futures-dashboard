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
        if (!ichimoku) return 'text-gray-400';
        if (isAboveCloud) return 'text-green-500';
        if (isBelowCloud) return 'text-red-500';
        return 'text-yellow-500';
    };

    const getStatusText = () => {
        if (!ichimoku) return 'ĐANG TÍNH TOÁN...';
        if (isAboveCloud) return 'GIÁ TRÊN MÂY (TĂNG)';
        if (isBelowCloud) return 'GIÁ DƯỚI MÂY (GIẢM)';
        return 'GIÁ TRONG MÂY (ĐI NGANG)';
    };

    return (
        <div className="card bg-gradient-to-br from-[var(--color-bg-secondary)] to-[#1a1a2e] border-[var(--color-border)] overflow-hidden">
            <div className="card-header flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <Cloud size={18} className="text-blue-400" />
                    <span className="font-bold tracking-wider uppercase text-xs">Mây Ichimoku</span>
                </div>
                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 ${getStatusColor()}`}>
                    {getStatusText()}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[var(--color-text-secondary)] mb-1 uppercase font-semibold text-center">Đường Chuyển Đổi (9)</span>
                    <span className={`text-sm font-mono ${tenkan > kijun ? 'text-green-400' : 'text-red-400'}`}>
                        {tenkan > 0 ? tenkan.toFixed(2) : '--'}
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[var(--color-text-secondary)] mb-1 uppercase font-semibold text-center">Đường Tiêu Chuẩn (26)</span>
                    <span className="text-sm font-mono text-blue-400">
                        {kijun > 0 ? kijun.toFixed(2) : '--'}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${spanA > spanB ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-[11px] text-[var(--color-text-secondary)]">Senkou Span A</span>
                    </div>
                    <span className="text-[11px] font-mono">{spanA > 0 ? spanA.toFixed(2) : '--'}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${spanB > spanA ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-[11px] text-[var(--color-text-secondary)]">Senkou Span B</span>
                    </div>
                    <span className="text-[11px] font-mono">{spanB > 0 ? spanB.toFixed(2) : '--'}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Giao cắt TK/KJ:</span>
                    {tenkan === 0 ? (
                        <span className="text-[10px] text-gray-500 tracking-tighter">--</span>
                    ) : tenkan > kijun ? (
                        <div className="flex items-center gap-1 text-green-500 text-[10px] font-black">
                            <Zap size={11} /> GIAO CẮT VÀNG (MUA)
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-red-500 text-[10px] font-black">
                            <Zap size={11} /> GIAO CẮT TỬ THẦN (BÁN)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
