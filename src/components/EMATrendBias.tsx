import React from 'react';
import { TrendingUp, TrendingDown, Minus, LineChart } from 'lucide-react';

interface TrendBias {
    timeframe: string;
    label: string;
    bias: 'bullish' | 'bearish' | 'neutral';
}

interface EMATrendBiasProps {
    trends: TrendBias[];
}

export const EMATrendBias: React.FC<EMATrendBiasProps> = ({ trends }) => {
    const getBiasIcon = (bias: string) => {
        switch (bias) {
            case 'bullish':
                return <TrendingUp size={16} className="text-[var(--color-long)]" />;
            case 'bearish':
                return <TrendingDown size={16} className="text-[var(--color-short)]" />;
            default:
                return <Minus size={16} className="text-[var(--color-silver)]" />;
        }
    };

    const getBiasLabel = (bias: string) => {
        switch (bias) {
            case 'bullish': return 'BULL_PHASE';
            case 'bearish': return 'BEAR_PHASE';
            default: return 'RE-BALANCING';
        }
    };

    const getBiasTheme = (bias: string) => {
        switch (bias) {
            case 'bullish':
                return 'text-[var(--color-long)] bg-[var(--color-long)]/5 border-[var(--color-long)]/20 shadow-[0_0_10px_rgba(0,255,163,0.05)]';
            case 'bearish':
                return 'text-[var(--color-short)] bg-[var(--color-short)]/5 border-[var(--color-short)]/20 shadow-[0_0_10px_rgba(255,0,51,0.05)]';
            default:
                return 'text-[var(--color-silver)] bg-white/5 border-white/10';
        }
    };

    const overallBias = () => {
        const bullishCount = trends.filter(t => t.bias === 'bullish').length;
        const bearishCount = trends.filter(t => t.bias === 'bearish').length;

        if (bullishCount > bearishCount) return 'bullish';
        if (bearishCount > bullishCount) return 'bearish';
        return 'neutral';
    };

    return (
        <div className="card flare-border reveal">
            <div className="card-header border-b border-[var(--color-border)] pb-4 mb-6">
                <LineChart size={14} className="text-[var(--color-flare)]" />
                <span className="font-black tracking-[0.2em] uppercase">Trend Momentum [EMA]</span>
            </div>

            <div className="space-y-4">
                {trends.map((trend, idx) => (
                    <div
                        key={trend.timeframe}
                        className={`flex items-center justify-between p-4 rounded-[2px] border ${getBiasTheme(trend.bias)} transition-all duration-500 reveal`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-[1px] ${trend.bias === 'bullish' ? 'bg-[var(--color-long)]/10' : trend.bias === 'bearish' ? 'bg-[var(--color-short)]/10' : 'bg-white/5'}`}>
                                {getBiasIcon(trend.bias)}
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--color-silver)] font-black uppercase tracking-[0.2em] opacity-40 mb-1">{trend.timeframe}</div>
                                <div className="text-xs font-black text-white tracking-widest">{trend.label}</div>
                            </div>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.3em] italic">
                            {getBiasLabel(trend.bias)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-[2px] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-flare)] opacity-50 group-hover:w-full group-hover:opacity-[0.02] transition-all duration-700"></div>
                <div className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-[0.4em] mb-4 opacity-40">
                    Sustained Narrative
                </div>
                <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-[1px] ${overallBias() === 'bullish' ? 'bg-[var(--color-long)] shadow-[0_0_15px_rgba(0,255,163,0.3)]' : overallBias() === 'bearish' ? 'bg-[var(--color-short)] shadow-[0_0_15px_rgba(255,0,51,0.3)]' : 'bg-white/10'}`}>
                        {overallBias() === 'bullish' ? <TrendingUp size={20} className="text-black" /> : overallBias() === 'bearish' ? <TrendingDown size={20} className="text-white" /> : <Minus size={20} className="text-white" />}
                    </div>
                    <span className={`text-2xl font-black italic tracking-tighter ${overallBias() === 'bullish'
                            ? 'text-[var(--color-long)]'
                            : overallBias() === 'bearish'
                                ? 'text-[var(--color-short)]'
                                : 'text-[var(--color-silver)]'
                        }`}>
                        {getBiasLabel(overallBias()).toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    );
};
