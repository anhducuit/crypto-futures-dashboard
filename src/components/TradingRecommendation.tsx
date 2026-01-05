import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, BarChart3 } from 'lucide-react';

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

interface TradingRecommendationProps {
    maAnalysis: MAAnalysis | null;
    onDirectionChange: (direction: 'long' | 'short') => void;
}

export const TradingRecommendation: React.FC<TradingRecommendationProps> = ({
    maAnalysis,
    onDirectionChange
}) => {
    if (!maAnalysis) return null;

    // 1. Separate timeframes
    const tf1m = maAnalysis.timeframes.find(t => t.timeframe === '1m');
    const tf15m = maAnalysis.timeframes.find(t => t.timeframe === '15m');
    const tf1h = maAnalysis.timeframes.find(t => t.timeframe === '1h');
    const tf4h = maAnalysis.timeframes.find(t => t.timeframe === '4h');

    // 2. Trend Analysis (1h & 4h) - Long term direction
    const trendScore = (tf1h?.trend === 'bullish' ? 1 : tf1h?.trend === 'bearish' ? -1 : 0) +
        (tf4h?.trend === 'bullish' ? 1 : tf4h?.trend === 'bearish' ? -1 : 0);

    const majorTrend: 'long' | 'short' | 'neutral' = trendScore >= 1 ? 'long' : trendScore <= -1 ? 'short' : 'neutral';

    // 3. Momentum Analysis (1m & 15m) - Entry signals
    const momentumScore = (tf1m?.trend === 'bullish' ? 1 : tf1m?.trend === 'bearish' ? -1 : 0) +
        (tf15m?.trend === 'bullish' ? 1 : tf15m?.trend === 'bearish' ? -1 : 0);

    const momentum: 'bullish' | 'bearish' | 'neutral' = momentumScore >= 1 ? 'bullish' : momentumScore <= -1 ? 'bearish' : 'neutral';

    // 4. Overbought/Oversold & Volume Logic
    const isOverbought = (tf15m?.rsi || 50) > 75 || (tf15m?.priceGap || 0) > 1.8;
    const isOversold = (tf15m?.rsi || 50) < 25 || (tf15m?.priceGap || 0) < -1.8;
    const isWeakVolume = (tf15m?.volumeRatio || 1) < 0.6;
    const isStrongVolume = (tf15m?.volumeRatio || 1) > 1.5;

    // 5. Final Recommendation Logic
    let recommendation: 'long' | 'short' | 'wait' = 'wait';
    let statusText = 'CHỜ ĐIỂM VÀO';
    let confidence = 0;
    let reasons: string[] = [];
    let warning: string | null = null;

    if (majorTrend === 'long') {
        if (momentum === 'bullish') {
            if (isOverbought) {
                recommendation = 'wait';
                statusText = 'QUÁ MUA - CẨN THẬN';
                confidence = 30;
                warning = 'Giá đã tăng quá mạnh và cách xa MA. Rủi ro đảo chiều cao.';
                reasons = ['Xu hướng chính vẫn TĂNG', 'Chỉ báo RSI/Price Gap báo động QUÁ MUA', 'Chờ giá hồi về vùng an toàn hoặc tích lũy thêm'];
            } else if (isWeakVolume) {
                recommendation = 'wait';
                statusText = 'TĂNG NHƯNG VOLUME YẾU';
                confidence = 45;
                warning = 'Lực mua không mạnh, cẩn thận bẫy tăng giá (Bull-trap).';
                reasons = ['Giá tăng nhưng Volume thấp hơn trung bình', 'Thiếu sự xác nhận của dòng tiền lớn', 'Cần quan sát thêm Volume khung 1h'];
            } else {
                recommendation = 'long';
                statusText = 'VÀO LỆNH LONG';
                confidence = isStrongVolume ? 90 : 80;
                reasons = [
                    'Xu hướng lớn (1h/4h) đang TĂNG mạnh',
                    'Xung lực ngắn hạn (1m/15m) đồng thuận TĂNG',
                    isStrongVolume ? 'Volume đột biến xác nhận lực mua mạnh' : 'Volume ổn định'
                ];
            }
        } else if (momentum === 'bearish') {
            recommendation = 'wait';
            statusText = 'ĐANG ĐIỀU CHỈNH - CHỜ MUA';
            confidence = 40;
            reasons = ['Xu hướng lớn vẫn là TĂNG', 'Giá đang điều chỉnh ngắn hạn (1m/15m)', 'Chờ nến 1m/15m đảo chiều xanh để vào lệnh'];
        } else {
            recommendation = 'wait';
            statusText = 'XU HƯỚNG TĂNG - ĐANG TÍCH LŨY';
            reasons = ['Xu hướng lớn TĂNG', 'Xung lực ngắn hạn đang đi ngang', 'Kiên nhẫn chờ tín hiệu bứt phá'];
        }
    } else if (majorTrend === 'short') {
        if (momentum === 'bearish') {
            if (isOversold) {
                recommendation = 'wait';
                statusText = 'QUÁ BÁN - HẠN CHẾ SHORT';
                confidence = 30;
                warning = 'Giá đã giảm sâu vào vùng quá bán. Dễ có nhịp hồi kỹ thuật.';
                reasons = ['Xu hướng chính vẫn GIẢM', 'RSI/Gap báo động QUÁ BÁN', 'Không nên đuổi theo giá ở vùng này'];
            } else if (isWeakVolume) {
                recommendation = 'wait';
                statusText = 'GIẢM NHƯNG VOLUME YẾU';
                confidence = 45;
                warning = 'Lực bán không mạnh, cẩn thận nhịp hồi bất ngờ.';
                reasons = ['Giá giảm nhưng thiếu Volume xác nhận', 'Cẩn thận với các nhịp quét râu nến', 'Nên chờ Volume tăng mạnh để vào lệnh'];
            } else {
                recommendation = 'short';
                statusText = 'VÀO LỆNH SHORT';
                confidence = isStrongVolume ? 90 : 80;
                reasons = [
                    'Xu hướng lớn (1h/4h) đang GIẢM mạnh',
                    'Xung lực ngắn hạn (1m/15m) đồng thuận GIẢM',
                    isStrongVolume ? 'Volume lớn xác nhận lực bán áp đảo' : 'Volume ổn định'
                ];
            }
        } else if (momentum === 'bullish') {
            recommendation = 'wait';
            statusText = 'HỒI PHỤC NGẮN HẠN - CHỜ BÁN';
            confidence = 40;
            reasons = ['Xu hướng lớn vẫn là GIẢM', 'Giá đang có nhịp hồi ngắn hạn', 'Chờ tín hiệu đảo chiều giảm ở khung 1m/15m'];
        } else {
            recommendation = 'wait';
            statusText = 'XU HƯỚNG GIẢM - ĐANG TÍCH LŨY';
            reasons = ['Xu hướng lớn GIẢM', 'Xung lực đang đi ngang', 'Chờ tín hiệu tiếp tục xu hướng giảm'];
        }
    } else {
        recommendation = 'wait';
        statusText = 'THỊ TRƯỜNG ĐI NGANG';
        reasons = ['Khung lớn (1h/4h) không rõ xu hướng', 'Tín hiệu mâu thuẫn hoặc volume thấp', 'Nên đứng ngoài quan sát'];
    }

    return (
        <div className="card">
            <div className="card-header">
                <Lightbulb size={16} className="text-[var(--color-golden)]" />
                ĐỀ XUẤT GIAO DỊCH (TREND + MOMENTUM)
            </div>

            <div className="space-y-4">
                {/* Stats Layer */}
                <div className="grid grid-cols-2 gap-2">
                    <div className={`p-2 rounded-lg border ${majorTrend === 'long' ? 'bg-green-500/10 border-green-500/30' : majorTrend === 'short' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">Xu hướng (1h/4h)</div>
                        <div className={`text-sm font-bold flex items-center gap-1 ${majorTrend === 'long' ? 'text-green-500' : majorTrend === 'short' ? 'text-red-500' : 'text-gray-400'}`}>
                            {majorTrend === 'long' ? <TrendingUp size={14} /> : majorTrend === 'short' ? <TrendingDown size={14} /> : <Minus size={14} />}
                            {majorTrend === 'long' ? 'TĂNG' : majorTrend === 'short' ? 'GIẢM' : 'TRUNG LẬP'}
                        </div>
                    </div>
                    <div className={`p-2 rounded-lg border ${momentum === 'bullish' ? 'bg-green-500/10 border-green-500/30' : momentum === 'bearish' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">Xung lực (1m/15m)</div>
                        <div className={`text-sm font-bold flex items-center gap-1 ${momentum === 'bullish' ? 'text-green-500' : momentum === 'bearish' ? 'text-red-500' : 'text-gray-400'}`}>
                            {momentum === 'bullish' ? <TrendingUp size={14} /> : momentum === 'bearish' ? <TrendingDown size={14} /> : <Minus size={14} />}
                            {momentum === 'bullish' ? 'TĂNG' : momentum === 'bearish' ? 'GIẢM' : 'ĐI NGANG'}
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
