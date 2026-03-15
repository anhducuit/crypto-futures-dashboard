import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';
import { useTranslation, type Language } from '../utils/translations';

interface TradingRecommendationProps {
    maAnalysis: MAAnalysis | null;
    onDirectionChange: (direction: 'long' | 'short') => void;
    language: Language;
}

export const TradingRecommendation: React.FC<TradingRecommendationProps> = ({
    maAnalysis,
    onDirectionChange,
    language
}) => {
    const t = useTranslation(language);
    if (!maAnalysis) return null;

    // 2. Trend Analysis (1H: MA20 vs MA50) - Major Trend
    const tf1h = maAnalysis.timeframes.find(t => t.timeframe === '60');
    const majorTrend: 'long' | 'short' | 'neutral' = tf1h?.trend === 'bullish' ? 'long' : tf1h?.trend === 'bearish' ? 'short' : 'neutral';

    // 3. Signal Trigger (15M: MA12 Cross MA26) - Entry
    const tf15m = maAnalysis.timeframes.find(t => t.timeframe === '15');
    let signalTrigger: 'bullish' | 'bearish' | 'neutral' = 'neutral';

    if (tf15m?.cross === 'bullish_cross') signalTrigger = 'bullish';
    else if (tf15m?.cross === 'bearish_cross') signalTrigger = 'bearish';
    // If no cross, check if trend matches major trend for continuity (optional context)
    else if (majorTrend === 'long' && tf15m?.trend === 'bullish') signalTrigger = 'neutral'; // 'neutral' but implicitly bullish context

    // 4. Filters
    const rsi15m = tf15m?.rsi;
    const isOverbought = rsi15m !== undefined && rsi15m > 75;
    const isOversold = rsi15m !== undefined && rsi15m < 25;
    const volRatio = tf15m?.volumeRatio;
    const isStrongVolume = volRatio !== undefined && volRatio > 1.5;

    // 5. Final Recommendation
    let recommendation: 'long' | 'short' | 'wait' = 'wait';
    let statusText = t('waiting_signal');
    let confidence = 0;
    let reasons: any[] = [];
    let warning: string | null = null;

    const ma20_1h = tf1h?.ma20 || 0;
    const ma50_1h = tf1h?.ma50 || 0;

    if (majorTrend === 'long') {
        if (signalTrigger === 'bullish') {
            if (!isOverbought) {
                recommendation = 'long';
                statusText = t('long_ma_cross');
                confidence = 85;
                reasons = [
                    { id: 'trend_1h_bullish', params: `(MA20 ${ma20_1h.toFixed(1)} > MA50 ${ma50_1h.toFixed(1)})` },
                    { id: 'signal_15m_bullish' },
                    { id: isStrongVolume ? 'vol_confirm_strong' : 'vol_stable' }
                ];
            } else {
                recommendation = 'wait';
                statusText = t('overbought_wait');
                warning = t('rsi_too_high');
            }
        } else {
            recommendation = 'wait';
            statusText = t('bullish_trend_wait_cross');
            reasons = [
                { id: 'trend_1h_bullish_context' },
                { id: 'waiting_15m_bullish_cross' },
                { id: 'patience_wait_cross' }
            ];
        }
    } else if (majorTrend === 'short') {
        if (signalTrigger === 'bearish') {
            if (!isOversold) {
                recommendation = 'short';
                statusText = t('short_ma_cross');
                confidence = 85;
                reasons = [
                    { id: 'trend_1h_bearish', params: `(MA20 ${ma20_1h.toFixed(1)} < MA50 ${ma50_1h.toFixed(1)})` },
                    { id: 'signal_15m_bearish' },
                    { id: isStrongVolume ? 'vol_sell_strong' : 'vol_stable' }
                ];
            } else {
                recommendation = 'wait';
                statusText = t('oversold_wait');
                warning = t('rsi_too_low');
            }
        } else {
            recommendation = 'wait';
            statusText = t('bearish_trend_wait_cross');
            reasons = [
                { id: 'trend_1h_bearish_context' },
                { id: 'waiting_15m_bearish_cross' },
                { id: 'patience_wait_cross' }
            ];
        }
    } else {
        recommendation = 'wait';
        statusText = t('neutral_trend');
        reasons = [{ id: 'ma_entangled' }, { id: 'sideways_market' }, { id: 'wait_observe' }];
    }

    return (
        <div className="card">
            <div className="card-header">
                <Lightbulb size={16} className="text-[var(--color-golden)]" />
                {t('ma_cross_strategy_title')}
            </div>

            <div className="space-y-4">
                {/* Stats Layer */}
                <div className="grid grid-cols-2 gap-2">
                    <div className={`p-2 rounded-[1px] border ${majorTrend === 'long' ? 'bg-green-500/10 border-green-500/30' : majorTrend === 'short' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">{t('tf_1h_trend_label')}</div>
                        <div className={`text-sm font-bold flex items-center gap-1 ${majorTrend === 'long' ? 'text-green-500' : majorTrend === 'short' ? 'text-red-500' : 'text-gray-400'}`}>
                            {majorTrend === 'long' ? <TrendingUp size={14} /> : majorTrend === 'short' ? <TrendingDown size={14} /> : <Minus size={14} />}
                            {majorTrend === 'long' ? 'BULLISH' : majorTrend === 'short' ? 'BEARISH' : 'NEUTRAL'}
                        </div>
                    </div>
                    <div className={`p-2 rounded-[1px] border ${signalTrigger === 'bullish' ? 'bg-green-500/10 border-green-500/30' : signalTrigger === 'bearish' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">{t('tf_15m_signal_label')}</div>
                        <div className={`text-xs font-bold flex items-center gap-1 ${signalTrigger === 'bullish' ? 'text-green-500' : signalTrigger === 'bearish' ? 'text-red-500' : 'text-gray-400'}`}>
                            {signalTrigger === 'bullish' ? <Activity size={14} /> : signalTrigger === 'bearish' ? <Activity size={14} /> : <Minus size={14} />}
                            {signalTrigger === 'bullish' ? t('golden_cross') : signalTrigger === 'bearish' ? t('death_cross') : t('no_signal')}
                        </div>
                    </div>
                </div>

                {/* Main Recommendation */}
                <div className={`p-4 rounded-[1px] text-center border-2 shadow-inner transition-all ${recommendation === 'long' ? 'bg-green-500/20 border-green-500/50' :
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
                            <span>{t('confidence_label')}:</span>
                            <div className="w-20 h-1.5 bg-slate-800 rounded-[1px] overflow-hidden">
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
                    <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-[1px] animate-pulse">
                        <AlertTriangle className="text-rose-500 shrink-0" size={16} />
                        <p className="text-[11px] text-rose-200 font-medium leading-tight">{warning}</p>
                    </div>
                )}

                {/* Overbought/Volume Inline Info */}
                <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-slate-800/50 rounded-[1px] border border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Activity size={12} /> RSI (15m)
                        </div>
                        <span className={`text-xs font-mono font-bold ${rsi15m !== undefined && rsi15m > 70 ? 'text-rose-400' : rsi15m !== undefined && rsi15m < 30 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {rsi15m !== undefined ? rsi15m.toFixed(1) : '--'}
                        </span>
                    </div>
                    <div className="flex-1 p-2 bg-slate-800/50 rounded-[1px] border border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <BarChart3 size={12} /> Vol Ratio
                        </div>
                        <span className={`text-xs font-mono font-bold ${volRatio !== undefined && volRatio > 1.5 ? 'text-emerald-400' : volRatio !== undefined && volRatio < 0.7 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {volRatio !== undefined ? `${volRatio.toFixed(2)}x` : '--'}
                        </span>
                    </div>
                </div>

                {/* Quick Action */}
                {(recommendation === 'long' || recommendation === 'short') && (
                    <button
                        onClick={() => onDirectionChange(recommendation as 'long' | 'short')}
                        className={`w-full py-2.5 rounded-[1px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${recommendation === 'long' ? 'bg-green-600 shadow-lg shadow-green-500/20' : 'bg-red-600 shadow-lg shadow-red-500/20'
                            }`}
                    >
                        {t('apply_action')} {recommendation.toUpperCase()}
                    </button>
                )}

                {/* Reasons */}
                <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-[1px]">
                    <div className="text-[10px] text-[var(--color-text-secondary)] uppercase mb-2">{t('analysis_details')}</div>
                    <ul className="space-y-1.5">
                        {reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-[1px] flex-shrink-0 ${recommendation === 'long' ? 'bg-green-500' : recommendation === 'short' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}></span>
                                <span className="text-white/80 leading-relaxed">{t(reason.id as any, reason.params)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
