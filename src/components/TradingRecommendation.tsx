import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface TradingRecommendationProps {
    maAnalysis: MAAnalysis | null;
    onDirectionChange: (direction: 'long' | 'short') => void;
}

export const TradingRecommendation: React.FC<TradingRecommendationProps> = ({
    maAnalysis,
    onDirectionChange
}) => {
    if (!maAnalysis) return null;

    // 2. Trend Analysis (1H: MA20 vs MA50) - Major Trend
    const tf1h = maAnalysis.timeframes.find(t => t.timeframe === '1h');
    const majorTrend: 'long' | 'short' | 'neutral' = tf1h?.trend === 'bullish' ? 'long' : tf1h?.trend === 'bearish' ? 'short' : 'neutral';

    // 3. Signal Trigger (15M: MA12 Cross MA26) - Entry
    const tf15m = maAnalysis.timeframes.find(t => t.timeframe === '15m');
    let signalTrigger: 'bullish' | 'bearish' | 'neutral' = 'neutral';

    if (tf15m?.cross === 'bullish_cross') signalTrigger = 'bullish';
    else if (tf15m?.cross === 'bearish_cross') signalTrigger = 'bearish';
    // If no cross, check if trend matches major trend for continuity (optional context)
    else if (majorTrend === 'long' && tf15m?.trend === 'bullish') signalTrigger = 'neutral'; // 'neutral' but implicitly bullish context

    // 4. Filters
    const isOverbought = (tf15m?.rsi || 50) > 75;
    const isOversold = (tf15m?.rsi || 50) < 25;
    const isStrongVolume = (tf15m?.volumeRatio || 1) > 1.5;

    // 5. Final Recommendation
    let recommendation: 'long' | 'short' | 'wait' = 'wait';
    let statusText = 'CHỜ TÍN HIỆU';
    let confidence = 0;
    let reasons: string[] = [];
    let warning: string | null = null;

    const ma20_1h = tf1h?.ma20 || 0;
    const ma50_1h = tf1h?.ma50 || 0;

    if (majorTrend === 'long') {
        if (signalTrigger === 'bullish') {
            if (!isOverbought) {
                recommendation = 'long';
                statusText = 'LONG (MA CROSS)';
                confidence = 85;
                reasons = [
                    `Trend 1H TĂNG (MA20 ${ma20_1h.toFixed(1)} > MA50 ${ma50_1h.toFixed(1)})`,
                    'Tín hiệu 15M: Bullish Cross (MA12 cắt LÊN MA26)',
                    isStrongVolume ? 'Volume xác nhận mạnh' : 'Volume ổn định'
                ];
            } else {
                recommendation = 'wait';
                statusText = 'QUÁ MUA - CHỜ HỒI';
                warning = 'Tín hiệu đẹp nhưng RSI đang quá cao (>75).';
            }
        } else {
            recommendation = 'wait';
            statusText = 'TREND TĂNG - CHỜ CROSS';
            reasons = [
                'Xu hướng 1H là TĂNG',
                'Chưa có tín hiệu Giao Cắt Lên ở 15M',
                'Kiên nhẫn chờ MA12 cắt lên MA26'
            ];
        }
    } else if (majorTrend === 'short') {
        if (signalTrigger === 'bearish') {
            if (!isOversold) {
                recommendation = 'short';
                statusText = 'SHORT (MA CROSS)';
                confidence = 85;
                reasons = [
                    `Trend 1H GIẢM (MA20 ${ma20_1h.toFixed(1)} < MA50 ${ma50_1h.toFixed(1)})`,
                    'Tín hiệu 15M: Bearish Cross (MA12 cắt XUỐNG MA26)',
                    isStrongVolume ? 'Volume bán mạnh' : 'Volume ổn định'
                ];
            } else {
                recommendation = 'wait';
                statusText = 'QUÁ BÁN - CHỜ HỒI';
                warning = 'Tín hiệu đẹp nhưng RSI đang quá thấp (<25).';
            }
        } else {
            recommendation = 'wait';
            statusText = 'TREND GIẢM - CHỜ CROSS';
            reasons = [
                'Xu hướng 1H là GIẢM',
                'Chưa có tín hiệu Giao Cắt Xuống ở 15M',
                'Kiên nhẫn chờ MA12 cắt xuống MA26'
            ];
        }
    } else {
        recommendation = 'wait';
        statusText = 'KHÔNG RÕ XU HƯỚNG';
        reasons = [`MA20 và MA50 khung 1H đang xoắn vào nhau`, 'Thị trường đi ngang', 'Nên đứng ngoài quan sát'];
    }

    return (
        <div className="card">
            <div className="card-header">
                <Lightbulb size={16} className="text-[var(--color-golden)]" />
                CHIẾN LƯỢC MA CROSS (1H + 15M)
            </div>

            <div className="space-y-4">
                {/* Stats Layer */}
                <div className="grid grid-cols-2 gap-2">
                    <div className={`p-2 rounded-lg border ${majorTrend === 'long' ? 'bg-green-500/10 border-green-500/30' : majorTrend === 'short' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">Xu hướng 1H (MA20/50)</div>
                        <div className={`text-sm font-bold flex items-center gap-1 ${majorTrend === 'long' ? 'text-green-500' : majorTrend === 'short' ? 'text-red-500' : 'text-gray-400'}`}>
                            {majorTrend === 'long' ? <TrendingUp size={14} /> : majorTrend === 'short' ? <TrendingDown size={14} /> : <Minus size={14} />}
                            {majorTrend === 'long' ? 'BULLISH' : majorTrend === 'short' ? 'BEARISH' : 'NEUTRAL'}
                        </div>
                    </div>
                    <div className={`p-2 rounded-lg border ${signalTrigger === 'bullish' ? 'bg-green-500/10 border-green-500/30' : signalTrigger === 'bearish' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">Tín hiệu 15M (MA12/26)</div>
                        <div className={`text-xs font-bold flex items-center gap-1 ${signalTrigger === 'bullish' ? 'text-green-500' : signalTrigger === 'bearish' ? 'text-red-500' : 'text-gray-400'}`}>
                            {signalTrigger === 'bullish' ? <Activity size={14} /> : signalTrigger === 'bearish' ? <Activity size={14} /> : <Minus size={14} />}
                            {signalTrigger === 'bullish' ? 'GOLDEN CROSS' : signalTrigger === 'bearish' ? 'DEATH CROSS' : 'KHÔNG CÓ'}
                        </div>
                    </div>
                </div>

                {/* Main Recommendation */}
                <div className={`p-4 rounded-xl text-center border-2 shadow-inner transition-all ${recommendation === 'long' ? 'bg-green-500/20 border-green-500/50' :
                    recommendation === 'short' ? 'bg-red-500/20 border-red-500/50' :
                        'bg-yellow-500/10 border-yellow-500/40'
                    }`}>
                    <div className={`text-2xl font-black mb-1 tracking-tight ${recommendation === 'long' ? 'text-green-500' :
                        recommendation === 'short' ? 'text-red-500' :
                            'text-yellow-500'
                        }`}>
                        {statusText}
                    </div>
                    {confidence > 0 && (
                        <div className="flex items-center justify-center gap-2 text-xs text-white/70">
                            <span>Độ tin cậy:</span>
                            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--color-golden)] transition-all duration-1000"
                                    style={{ width: `${confidence}%` }}
                                />
                            </div>
                            <span className="text-[var(--color-golden)] font-bold">{confidence}%</span>
                        </div>
                    )}
                </div>

                {/* Warning Alert */}
                {warning && (
                    <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg animate-pulse">
                        <AlertTriangle className="text-rose-500 shrink-0" size={16} />
                        <p className="text-[11px] text-rose-200 font-medium leading-tight">{warning}</p>
                    </div>
                )}

                {/* Overbought/Volume Inline Info */}
                <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Activity size={12} /> RSI (15m)
                        </div>
                        <span className={`text-xs font-mono font-bold ${(tf15m?.rsi || 50) > 70 ? 'text-rose-400' : (tf15m?.rsi || 50) < 30 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {(tf15m?.rsi || 50).toFixed(1)}
                        </span>
                    </div>
                    <div className="flex-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <BarChart3 size={12} /> Vol Ratio
                        </div>
                        <span className={`text-xs font-mono font-bold ${(tf15m?.volumeRatio || 1) > 1.5 ? 'text-emerald-400' : (tf15m?.volumeRatio || 1) < 0.7 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {(tf15m?.volumeRatio || 1).toFixed(2)}x
                        </span>
                    </div>
                </div>

                {/* Quick Action */}
                {(recommendation === 'long' || recommendation === 'short') && (
                    <button
                        onClick={() => onDirectionChange(recommendation as 'long' | 'short')}
                        className={`w-full py-2.5 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${recommendation === 'long' ? 'bg-green-600 shadow-lg shadow-green-500/20' : 'bg-red-600 shadow-lg shadow-red-500/20'
                            }`}
                    >
                        ÁP DỤNG {recommendation.toUpperCase()}
                    </button>
                )}

                {/* Reasons */}
                <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                    <div className="text-[10px] text-[var(--color-text-secondary)] uppercase mb-2">Chi tiết phân tích</div>
                    <ul className="space-y-1.5">
                        {reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${recommendation === 'long' ? 'bg-green-500' : recommendation === 'short' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}></span>
                                <span className="text-white/80 leading-relaxed">{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
