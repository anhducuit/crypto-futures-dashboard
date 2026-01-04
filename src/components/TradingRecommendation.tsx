import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface MAAnalysis {
    timeframes: {
        timeframe: string;
        label: string;
        ma: number;
        currentPrice: number;
        trend: 'bullish' | 'bearish' | 'neutral';
        swingHigh: number;
        swingLow: number;
    }[];
    overallBias: 'long' | 'short' | 'neutral';
    confidence: number;
}

interface TrendBias {
    timeframe: string;
    label: string;
    bias: 'bullish' | 'bearish' | 'neutral';
}

interface TradingRecommendationProps {
    maAnalysis: MAAnalysis | null;
    emaTrends: TrendBias[];
    onDirectionChange: (direction: 'long' | 'short') => void;
}

export const TradingRecommendation: React.FC<TradingRecommendationProps> = ({
    maAnalysis,
    emaTrends,
    onDirectionChange
}) => {
    // Calculate EMA bias
    const emaBullishCount = emaTrends.filter(t => t.bias === 'bullish').length;
    const emaBearishCount = emaTrends.filter(t => t.bias === 'bearish').length;
    const emaBias = emaBullishCount > emaBearishCount ? 'long' : emaBearishCount > emaBullishCount ? 'short' : 'neutral';

    // Combine MA and EMA analysis
    const maBias = maAnalysis?.overallBias || 'neutral';
    const maConfidence = maAnalysis?.confidence || 0;

    // Overall recommendation logic
    let recommendation: 'long' | 'short' | 'wait' = 'wait';
    let confidence = 0;
    let reasons: string[] = [];

    if (maBias === 'long' && emaBias === 'long') {
        recommendation = 'long';
        confidence = Math.min(90, maConfidence + 20);
        reasons = [
            'MA các khung thời gian đều cho tín hiệu tăng',
            'EMA dài hạn confirm xu hướng tăng',
            'Giá đang trade trên MA20'
        ];
    } else if (maBias === 'short' && emaBias === 'short') {
        recommendation = 'short';
        confidence = Math.min(90, maConfidence + 20);
        reasons = [
            'MA các khung thời gian đều cho tín hiệu giảm',
            'EMA dài hạn confirm xu hướng giảm',
            'Giá đang trade dưới MA20'
        ];
    } else if (maBias === 'long' && emaBias !== 'short') {
        recommendation = 'long';
        confidence = Math.max(50, maConfidence);
        reasons = [
            'MA ngắn hạn cho tín hiệu tăng',
            'Cân nhắc chờ EMA confirm'
        ];
    } else if (maBias === 'short' && emaBias !== 'long') {
        recommendation = 'short';
        confidence = Math.max(50, maConfidence);
        reasons = [
            'MA ngắn hạn cho tín hiệu giảm',
            'Cân nhắc chờ EMA confirm'
        ];
    } else {
        recommendation = 'wait';
        confidence = 0;
        reasons = [
            'Tín hiệu MA và EMA đang mâu thuẫn',
            'Chờ đợi xu hướng rõ ràng hơn',
            'Không nên vào lệnh trong giai đoạn này'
        ];
    }

    return (
        <div className="card">
            <div className="card-header">
                <Lightbulb size={16} className="text-[var(--color-golden)]" />
                ĐỀ XUẤT GIAO DỊCH
            </div>

            <div className="space-y-4">
                {/* Main Recommendation */}
                <div className={`p-5 rounded-xl text-center ${recommendation === 'long'
                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/50'
                    : recommendation === 'short'
                        ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/50'
                        : 'bg-gradient-to-br from-gray-500/20 to-gray-600/10 border-2 border-gray-500/50'
                    }`}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        {recommendation === 'long' ? (
                            <TrendingUp size={40} className="text-green-500" />
                        ) : recommendation === 'short' ? (
                            <TrendingDown size={40} className="text-red-500" />
                        ) : (
                            <AlertTriangle size={40} className="text-yellow-500" />
                        )}
                    </div>

                    <div className={`text-3xl font-bold mb-2 ${recommendation === 'long'
                        ? 'text-green-500'
                        : recommendation === 'short'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        }`}>
                        {recommendation === 'long' ? 'NÊN LONG' : recommendation === 'short' ? 'NÊN SHORT' : 'CHỜ ĐỢI'}
                    </div>

                    {confidence > 0 && (
                        <div className="text-sm text-[var(--color-text-secondary)]">
                            Độ tin cậy: <span className="text-[var(--color-golden)] font-bold">{confidence}%</span>
                        </div>
                    )}
                </div>

                {/* Quick Action Button */}
                {recommendation !== 'wait' && (
                    <button
                        onClick={() => onDirectionChange(recommendation as 'long' | 'short')}
                        className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${recommendation === 'long'
                            ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/25'
                            : 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/25'
                            }`}
                    >
                        {recommendation === 'long' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        Áp dụng {recommendation.toUpperCase()}
                    </button>
                )}

                {/* Analysis Summary */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <span className="text-sm text-[var(--color-text-secondary)]">Phân tích MA (ngắn hạn)</span>
                        <span className={`text-sm font-semibold flex items-center gap-1.5 ${maBias === 'long' ? 'text-green-500' : maBias === 'short' ? 'text-red-500' : 'text-[var(--color-text-secondary)]'
                            }`}>
                            {maBias === 'long' ? <CheckCircle2 size={14} /> : maBias === 'short' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                            {maBias === 'long' ? 'LONG' : maBias === 'short' ? 'SHORT' : 'NEUTRAL'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <span className="text-sm text-[var(--color-text-secondary)]">Phân tích EMA (dài hạn)</span>
                        <span className={`text-sm font-semibold flex items-center gap-1.5 ${emaBias === 'long' ? 'text-green-500' : emaBias === 'short' ? 'text-red-500' : 'text-[var(--color-text-secondary)]'
                            }`}>
                            {emaBias === 'long' ? <CheckCircle2 size={14} /> : emaBias === 'short' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                            {emaBias === 'long' ? 'LONG' : emaBias === 'short' ? 'SHORT' : 'NEUTRAL'}
                        </span>
                    </div>
                </div>

                {/* Reasons */}
                <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                    <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
                        Lý do đề xuất
                    </div>
                    <ul className="space-y-1.5">
                        {reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${recommendation === 'wait' ? 'bg-yellow-500' : recommendation === 'long' ? 'bg-green-500' : 'bg-red-500'
                                    }`}></span>
                                <span className="text-[var(--color-text-secondary)]">{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Warning */}
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-300/80">
                        Đây chỉ là gợi ý dựa trên phân tích kỹ thuật. Luôn quản lý rủi ro và không đầu tư quá khả năng chịu lỗ.
                    </p>
                </div>
            </div>
        </div>
    );
};
