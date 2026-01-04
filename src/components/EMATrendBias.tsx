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
                return <TrendingUp size={18} className="text-green-500" />;
            case 'bearish':
                return <TrendingDown size={18} className="text-red-500" />;
            default:
                return <Minus size={18} className="text-[var(--color-text-secondary)]" />;
        }
    };

    const getBiasLabel = (bias: string) => {
        switch (bias) {
            case 'bullish':
                return 'Tăng';
            case 'bearish':
                return 'Giảm';
            default:
                return 'Trung lập';
        }
    };

    const getBiasColor = (bias: string) => {
        switch (bias) {
            case 'bullish':
                return 'text-green-500 bg-green-500/10 border-green-500/30';
            case 'bearish':
                return 'text-red-500 bg-red-500/10 border-red-500/30';
            default:
                return 'text-[var(--color-text-secondary)] bg-white/5 border-white/10';
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
        <div className="card">
            <div className="card-header">
                <LineChart size={16} className="text-[var(--color-golden)]" />
                XU HƯỚNG EMA
            </div>

            <div className="space-y-3">
                {trends.map((trend) => (
                    <div
                        key={trend.timeframe}
                        className={`flex items-center justify-between p-3 rounded-lg border ${getBiasColor(trend.bias)}`}
                    >
                        <div className="flex items-center gap-3">
                            {getBiasIcon(trend.bias)}
                            <div>
                                <div className="font-medium text-white">{trend.label}</div>
                                <div className="text-xs text-[var(--color-text-secondary)]">{trend.timeframe}</div>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${trend.bias === 'bullish'
                                ? 'bg-green-500/20 text-green-400'
                                : trend.bias === 'bearish'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-white/10 text-[var(--color-text-secondary)]'
                            }`}>
                            {getBiasLabel(trend.bias)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-[var(--color-bg-tertiary)] to-[var(--color-bg-primary)] border border-[var(--color-border)]">
                <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
                    Xu Hướng Tổng Thể
                </div>
                <div className="flex items-center gap-3">
                    {getBiasIcon(overallBias())}
                    <span className={`text-xl font-bold ${overallBias() === 'bullish'
                            ? 'text-green-500'
                            : overallBias() === 'bearish'
                                ? 'text-red-500'
                                : 'text-[var(--color-text-secondary)]'
                        }`}>
                        {getBiasLabel(overallBias()).toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    );
};
