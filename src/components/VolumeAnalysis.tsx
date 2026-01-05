import React from 'react';
import { BarChart3, Info } from 'lucide-react';

interface MAAnalysis {
    timeframes: {
        timeframe: string;
        label: string;
        ma: number;
        currentPrice: number;
        trend: 'bullish' | 'bearish' | 'neutral';
        swingHigh: number;
        swingLow: number;
        rsi: number;
        avgVolume: number;
        currentVolume: number;
        volumeRatio: number;
        priceGap: number;
    }[];
    overallBias: 'long' | 'short' | 'neutral';
    confidence: number;
}

interface VolumeAnalysisProps {
    maAnalysis: MAAnalysis | null;
}

export const VolumeAnalysis: React.FC<VolumeAnalysisProps> = ({ maAnalysis }) => {
    if (!maAnalysis) return null;

    return (
        <div className="card">
            <div className="card-header">
                <BarChart3 size={16} className="text-[var(--color-golden)]" />
                PHÂN TÍCH KHỐI LƯỢNG (VOLUME)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {maAnalysis.timeframes.map((tf) => {
                    const isSurge = tf.volumeRatio > 1.5;
                    const isWeak = tf.volumeRatio < 0.7;

                    return (
                        <div
                            key={tf.timeframe}
                            className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-2 border border-transparent hover:border-[var(--color-border)] transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={16} className={isSurge ? 'text-green-500' : isWeak ? 'text-red-500' : 'text-[var(--color-text-secondary)]'} />
                                    <span className="font-medium">{tf.label}</span>
                                </div>
                                <span className={`text-sm font-semibold ${isSurge ? 'text-green-500' : isWeak ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}>
                                    {isSurge ? 'Đột Biến' : isWeak ? 'Yếu' : 'Ổn Định'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-[var(--color-text-secondary)]">Ratio: </span>
                                    <span className={`font-mono font-bold ${isSurge ? 'text-green-400' : isWeak ? 'text-red-400' : 'text-white'}`}>
                                        {tf.volumeRatio.toFixed(2)}x
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[var(--color-text-secondary)]">RSI: </span>
                                    <span className={`font-mono font-bold ${tf.rsi > 70 ? 'text-red-400' : tf.rsi < 30 ? 'text-green-400' : 'text-white'}`}>
                                        {tf.rsi.toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                                <div className="text-[10px] w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${isSurge ? 'bg-green-500' : isWeak ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min(tf.volumeRatio * 30, 100)}%` }}
                                    />
                                </div>
                                <div className="ml-3 text-[10px] whitespace-nowrap">
                                    <span className="text-[var(--color-text-secondary)]">Gap: </span>
                                    <span className={`font-mono ${tf.priceGap > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {tf.priceGap > 0 ? '+' : ''}{tf.priceGap.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    <strong className="text-blue-300">Tips:</strong> Volume đột biến kèm theo xu hướng giá đồng thuận là tín hiệu xác nhận cực mạnh. Nếu giá tăng nhưng Volume yếu, hãy cẩn thận với cái bẫy tăng giá (Bull-trap).
                </p>
            </div>
        </div>
    );
};
