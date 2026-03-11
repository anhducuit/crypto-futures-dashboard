import React from 'react';
import { Bell, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface ChandelierExitPanelProps {
    data: MAAnalysis | null;
    activeTimeframe: string;
}

export const ChandelierExitPanel: React.FC<ChandelierExitPanelProps> = ({ data, activeTimeframe }) => {
    if (!data) return null;

    const tf = data.timeframes.find(t => t.timeframe === activeTimeframe);
    if (!tf || !tf.chandelierExit) return null;

    const ce = tf.chandelierExit;
    const price = tf.currentPrice;

    const formatPrice = (p: number) => {
        if (p < 1) return p.toFixed(6);
        if (p < 10) return p.toFixed(4);
        return p.toFixed(2);
    };

    const distToExitLong = ((price - ce.exitLong) / price * 100);
    const distToExitShort = ((ce.exitShort - price) / price * 100);

    const trendColor = ce.trend === 'BULLISH'
        ? 'text-green-400'
        : ce.trend === 'BEARISH'
            ? 'text-red-400'
            : 'text-yellow-400';

    const trendBg = ce.trend === 'BULLISH'
        ? 'bg-green-500/10 border-green-500/30'
        : ce.trend === 'BEARISH'
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-yellow-500/10 border-yellow-500/30';

    const trendIcon = ce.trend === 'BULLISH'
        ? <TrendingUp size={16} className="text-green-400" />
        : ce.trend === 'BEARISH'
            ? <TrendingDown size={16} className="text-red-400" />
            : <Activity size={16} className="text-yellow-400" />;

    const trendLabel = ce.trend === 'BULLISH' ? 'XU HƯỚNG TĂNG'
        : ce.trend === 'BEARISH' ? 'XU HƯỚNG GIẢM'
        : 'TRUNG LẬP';

    return (
        <div className="card">
            <div className="card-header">
                <Bell size={16} className="text-[var(--color-golden)]" />
                CHỈ BÁO THOÁT CHANDELIER
            </div>

            <div className="p-4 space-y-3">
                {/* Trend Badge */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${trendBg}`}>
                    <div className="flex items-center gap-2">
                        {trendIcon}
                        <span className={`text-sm font-bold ${trendColor}`}>{trendLabel}</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                        Period: 22 | ATR × 3.0
                    </span>
                </div>

                {/* Signal Alerts */}
                {ce.buySignal && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/15 border border-green-500/40 rounded-lg animate-pulse">
                        <ArrowUpRight size={18} className="text-green-400" />
                        <div>
                            <span className="text-green-400 font-bold text-sm">🔔 TÍN HIỆU MUA</span>
                            <p className="text-xs text-green-300/70 mt-0.5">Giá vượt lên trên Chandelier Exit Short</p>
                        </div>
                    </div>
                )}
                {ce.sellSignal && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/15 border border-red-500/40 rounded-lg animate-pulse">
                        <ArrowDownRight size={18} className="text-red-400" />
                        <div>
                            <span className="text-red-400 font-bold text-sm">🔔 TÍN HIỆU BÁN</span>
                            <p className="text-xs text-red-300/70 mt-0.5">Giá rớt xuống dưới Chandelier Exit Long</p>
                        </div>
                    </div>
                )}

                {/* Exit Levels */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Exit Long (Support trailing) */}
                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <div className="text-[10px] text-green-400 font-medium mb-1 uppercase tracking-wider">
                            Thoát Long (Trailing)
                        </div>
                        <div className="text-base font-bold text-[var(--color-text-primary)]">
                            ${formatPrice(ce.exitLong)}
                        </div>
                        <div className={`text-[10px] mt-1 ${distToExitLong > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {distToExitLong > 0 ? '↑' : '↓'} {Math.abs(distToExitLong).toFixed(2)}% từ giá
                        </div>
                    </div>

                    {/* Exit Short (Resistance trailing) */}
                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <div className="text-[10px] text-red-400 font-medium mb-1 uppercase tracking-wider">
                            Thoát Short (Trailing)
                        </div>
                        <div className="text-base font-bold text-[var(--color-text-primary)]">
                            ${formatPrice(ce.exitShort)}
                        </div>
                        <div className={`text-[10px] mt-1 ${distToExitShort > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {distToExitShort > 0 ? '↓' : '↑'} {Math.abs(distToExitShort).toFixed(2)}% từ giá
                        </div>
                    </div>
                </div>

                {/* Key Data */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">ATR (22)</div>
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">${formatPrice(ce.atr)}</div>
                    </div>
                    <div className="text-center p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">Đỉnh cao</div>
                        <div className="text-sm font-bold text-green-400">${formatPrice(ce.highestHigh)}</div>
                    </div>
                    <div className="text-center p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">Đáy thấp</div>
                        <div className="text-sm font-bold text-red-400">${formatPrice(ce.lowestLow)}</div>
                    </div>
                </div>

                {/* Explanation */}
                <div className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)] pt-2">
                    <span className="text-green-400">■</span> Thoát Long = Đỉnh cao({22}) − ATR × 3.0 • 
                    <span className="text-red-400"> ■</span> Thoát Short = Đáy thấp({22}) + ATR × 3.0
                </div>
            </div>
        </div>
    );
};
