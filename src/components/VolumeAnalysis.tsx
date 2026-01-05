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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {maAnalysis.timeframes.map((tf) => {
                    const isSurge = tf.volumeRatio > 1.5;
                    const isWeak = tf.volumeRatio < 0.7;

                    return (
                        <div key={tf.timeframe} className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all flex flex-col gap-5">
                            {/* Header: Label & Status indicator */}
                            <div className="flex items-center justify-between border-b border-slate-700/30 pb-3">
                                <span className="text-xs font-black text-slate-100 bg-slate-700/50 px-2 py-1 rounded-md uppercase tracking-widest">
                                    {tf.label}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${isSurge ? 'bg-emerald-500 animate-pulse' : isWeak ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                    <span className={`text-[10px] font-bold uppercase ${isSurge ? 'text-emerald-400' : isWeak ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {isSurge ? 'Đột Biến' : isWeak ? 'Yếu' : 'Ổn Định'}
                                    </span>
                                </div>
                            </div>

                            {/* Main Metric: Volume Ratio */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tỉ lệ Volume</span>
                                    <span className={`text-xl font-black font-mono ${isSurge ? 'text-emerald-400' : isWeak ? 'text-rose-400' : 'text-slate-200'}`}>
                                        {tf.volumeRatio.toFixed(2)}x
                                    </span>
                                </div>
                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${isSurge ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                                isWeak ? 'bg-rose-500' :
                                                    'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min(tf.volumeRatio * 30, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Secondary Metrics: RSI & MA Gap */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/30 flex flex-col items-center gap-1">
                                    <span className="text-[9px] text-slate-500 uppercase font-black">RSI (14)</span>
                                    <span className={`text-sm font-black font-mono ${tf.rsi > 70 ? 'text-rose-400' : tf.rsi < 30 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                        {tf.rsi.toFixed(1)}
                                    </span>
                                </div>
                                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/30 flex flex-col items-center gap-1">
                                    <span className="text-[9px] text-slate-500 uppercase font-black">MA Gap</span>
                                    <span className={`text-sm font-black font-mono ${tf.priceGap > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tf.priceGap > 0 ? '+' : ''}{tf.priceGap.toFixed(2)}%
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
