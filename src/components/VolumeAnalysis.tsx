import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

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
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <BarChart3 className="text-blue-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-100">PHÂN TÍCH KHỐI LƯỢNG (VOLUME)</h2>
                    <p className="text-slate-400 text-sm">So sánh volume hiện tại với trung bình 20 nến</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {maAnalysis.timeframes.map((tf) => {
                    const isSurge = tf.volumeRatio > 1.5;
                    const isWeak = tf.volumeRatio < 0.7;

                    return (
                        <div key={tf.timeframe} className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-slate-300">{tf.label}</span>
                                {isSurge ? (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                                        <TrendingUp size={10} /> ĐỘT BIẾN
                                    </span>
                                ) : isWeak ? (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                                        <TrendingDown size={10} /> YẾU
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-slate-500/10 text-slate-400 rounded-full border border-slate-500/20">
                                        <Minus size={10} />ỔN ĐỊNH
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Tỉ lệ Volume:</span>
                                    <span className={`font-mono ${isSurge ? 'text-emerald-400' : isWeak ? 'text-rose-400' : 'text-slate-300'}`}>
                                        {tf.volumeRatio.toFixed(2)}x
                                    </span>
                                </div>
                                <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isSurge ? 'bg-emerald-500' : isWeak ? 'bg-rose-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min(tf.volumeRatio * 30, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500">RSI (14):</span>
                                    <span className={`font-mono ${tf.rsi > 70 ? 'text-rose-400' : tf.rsi < 30 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                        {tf.rsi.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex items-start gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-blue-300">Tips:</strong> Volume đột biến kèm theo xu hướng giá đồng thuận là tín hiệu xác nhận cực mạnh. Nếu giá tăng nhưng Volume yếu, hãy cẩn thận với cái bẫy tăng giá (Bull-trap).
                </p>
            </div>
        </div>
    );
};
