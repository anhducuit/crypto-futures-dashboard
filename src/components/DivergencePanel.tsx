import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface DivergencePanelProps {
    data: MAAnalysis | null;
    activeTimeframe: string;
}

export function DivergencePanel({ data, activeTimeframe }: DivergencePanelProps) {
    const tfData = data?.timeframes.find(t => t.timeframe === activeTimeframe);
    const divergence = tfData?.divergence || 'none';
    const rsi = tfData?.rsi || 0;

    const isBullish = divergence === 'bullish';
    const isBearish = divergence === 'bearish';

    return (
        <div className="card bg-gradient-to-br from-[var(--color-bg-secondary)] to-[#1a1a2e] border-[var(--color-border)] overflow-hidden">
            <div className="card-header border-b border-[var(--color-border)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-purple-400" />
                    <span className="font-bold tracking-wider uppercase text-xs">Phân tích Phân Kỳ</span>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* RSI Status */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[11px] text-[var(--color-text-secondary)] font-bold uppercase">Chỉ số RSI</span>
                    <span className={`text-sm font-black ${rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-green-400' : 'text-[var(--color-golden)]'}`}>
                        {rsi > 0 ? rsi.toFixed(2) : '--'}
                    </span>
                </div>

                {/* Divergence Status */}
                <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all duration-500 ${isBullish ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]' :
                    isBearish ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
                        'bg-white/5 border-white/10'
                    }`}>
                    {isBullish ? (
                        <>
                            <TrendingUp size={48} className="text-green-500 mb-3 animate-bounce" />
                            <span className="text-lg font-black text-green-500 tracking-tighter">PHÂN KỲ HỘI TỤ (TĂNG)</span>
                            <p className="text-[10px] text-green-400/70 mt-1 uppercase font-bold">Dấu hiệu đảo chiều TĂNG giá</p>
                        </>
                    ) : isBearish ? (
                        <>
                            <TrendingDown size={48} className="text-red-500 mb-3 animate-bounce" />
                            <span className="text-lg font-black text-red-500 tracking-tighter">PHÂN KỲ GIẢM (BEARISH)</span>
                            <p className="text-[10px] text-red-400/70 mt-1 uppercase font-bold">Dấu hiệu đảo chiều GIẢM giá</p>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={40} className="text-[var(--color-text-secondary)] mb-3 opacity-30" />
                            <span className="text-xs font-bold text-[var(--color-text-secondary)] opacity-50 uppercase tracking-widest">Không có phân kỳ</span>
                        </>
                    )}
                </div>

                {/* Quick Guide */}
                <div className="p-3 rounded-lg bg-black/20 text-[10px] text-[var(--color-text-secondary)] leading-relaxed italic border border-white/5">
                    * Được tính dựa trên 50 nến gần nhất, so sánh đỉnh/đáy giá với RSI.
                </div>
            </div>
        </div>
    );
}
