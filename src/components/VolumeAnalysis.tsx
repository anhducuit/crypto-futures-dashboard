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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {maAnalysis.timeframes.map((tf) => {
                    const isSurge = tf.volumeRatio > 1.5;
                    const isWeak = tf.volumeRatio < 0.7;

                    return (
                        <div key={tf.timeframe} className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/60 hover:border-blue-500/30 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col sm:flex-row gap-6 items-center">
                            {/* Left Side: Timeframe & Status */}
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-2xl min-w-[100px] border border-slate-700/50">
                                <span className="text-xl font-black text-slate-100 mb-1">{tf.label.split(' ')[0]}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{tf.label.split(' ')[1]}</span>
                                <div className={`mt-3 px-2 py-0.5 rounded-full text-[9px] font-black border ${isSurge ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        isWeak ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                    {isSurge ? 'ĐỘT BIẾN' : isWeak ? 'YẾU' : 'ỔN ĐỊNH'}
                                </div>
                            </div>

                            {/* Right Side: Metrics Row */}
                            <div className="flex-1 w-full space-y-5">
                                {/* Volume Progress */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tỉ Lệ Volume</span>
                                        <span className={`text-2xl font-black font-mono leading-none ${isSurge ? 'text-emerald-400' : isWeak ? 'text-rose-400' : 'text-slate-100'}`}>
                                            {tf.volumeRatio.toFixed(2)}<span className="text-xs ml-1 opacity-50">x</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isSurge ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                                    isWeak ? 'bg-gradient-to-r from-rose-600 to-rose-400' :
                                                        'bg-gradient-to-r from-blue-600 to-blue-400'
                                                }`}
                                            style={{ width: `${Math.min(tf.volumeRatio * 30, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* RSI & GAP Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-700/30 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">RSI</span>
                                        <span className={`font-mono font-black ${tf.rsi > 70 ? 'text-rose-400' : tf.rsi < 30 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                            {tf.rsi.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-700/30 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">GAP</span>
                                        <span className={`font-mono font-black ${tf.priceGap > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {tf.priceGap > 0 ? '+' : ''}{tf.priceGap.toFixed(2)}%
                                        </span>
                                    </div>
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
