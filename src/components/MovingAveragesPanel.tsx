import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, RefreshCw, Share2 } from 'lucide-react';
import { formatNumber } from '../utils/calculations';
import type { MAAnalysis } from '../hooks/useBinanceKlines';
import { AnalysisShareModal } from './AnalysisShareModal';

import { useTranslation, type Language } from '../utils/translations';

interface MovingAveragesPanelProps {
    symbol: string;
    data: MAAnalysis | null;
    loading: boolean;
    onRefresh: () => void;
    activeTimeframe?: string;
    language: Language;
}

export const MovingAveragesPanel: React.FC<MovingAveragesPanelProps> = ({
    symbol,
    data,
    loading,
    onRefresh,
    activeTimeframe,
    language
}) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const t = useTranslation(language);

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'bullish':
                return <TrendingUp size={14} className="text-[var(--color-long)]" />;
            case 'bearish':
                return <TrendingDown size={14} className="text-[var(--color-short)]" />;
            default:
                return <Minus size={14} className="text-[var(--color-silver)]" />;
        }
    };

    const getTrendLabel = (trend: string) => {
        switch (trend) {
            case 'bullish': return 'BULL';
            case 'bearish': return 'BEAR';
            default: return 'SIDE';
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'bullish': return 'text-[var(--color-long)]';
            case 'bearish': return 'text-[var(--color-short)]';
            default: return 'text-[var(--color-silver)]';
        }
    };

    const getDecimals = (price: number) => {
        if (price >= 1000) return 2;
        if (price >= 1) return 4;
        return 6;
    };

    return (
        <div className="card flare-border reveal shadow-2xl shadow-black/40">
            <div className="card-header border-b border-[var(--color-border)] pb-4 mb-8 justify-between">
                <div className="flex items-center gap-3">
                    <BarChart3 size={14} className="text-[var(--color-flare)]" />
                    <span className="font-black tracking-[0.2em] uppercase">{t('ma_protocol_hub')}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        disabled={!data}
                        className="p-2 text-[var(--color-silver)] hover:text-[var(--color-flare)] transition-all duration-300 disabled:opacity-10"
                        title="Broadcast Report"
                    >
                        <Share2 size={16} />
                    </button>
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className={`p-2 text-[var(--color-silver)] hover:text-white transition-all duration-300 ${loading ? 'animate-spin' : ''}`}
                        title="Resync Data"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {loading && !data && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-[1px] border-[var(--color-flare)] border-t-transparent rounded-full shadow-[0_0_15px_rgba(255,77,0,0.2)]"></div>
                </div>
            )}

            {data && (
                <div className="space-y-4">
                    {/* Timeframe Analysis */}
                    <div className="grid grid-cols-1 gap-4">
                        {data.timeframes.map((tf, idx) => (
                            <div
                                key={tf.timeframe}
                                className={`p-4 rounded-[1px] border transition-all duration-500 reveal ${activeTimeframe === tf.timeframe
                                    ? 'bg-[var(--color-bg-tertiary)] border-[var(--color-flare)]/40 shadow-[0_0_20px_rgba(255,77,0,0.05)]'
                                    : 'bg-[var(--color-bg-tertiary)]/50 border-[var(--color-border)] opacity-60 grayscale-[0.5]'
                                    }`}
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-[1px] ${tf.trend === 'bullish' ? 'bg-[var(--color-long)]/10' : tf.trend === 'bearish' ? 'bg-[var(--color-short)]/10' : 'bg-white/5'}`}>
                                            {getTrendIcon(tf.trend)}
                                        </div>
                                        <span className="text-xs font-black tracking-widest text-white">{t(tf.label as any)}</span>
                                    </div>
                                    <span className={`text-[10px] font-black tracking-[0.2em] italic ${getTrendColor(tf.trend)}`}>
                                        {getTrendLabel(tf.trend)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {tf.timeframe === '4h' ? (
                                        <>
                                            <div className="bg-black/20 p-2 border-l border-[var(--color-border)]">
                                                <div className="text-[9px] text-[var(--color-silver)] uppercase mb-1 font-black opacity-30">{t('ma_anchor_50')}</div>
                                                <div className="text-[11px] text-white font-mono font-bold">${formatNumber(tf.ma50 || 0, getDecimals(tf.ma50 || 0))}</div>
                                            </div>
                                            <div className="bg-black/20 p-2 border-l border-[var(--color-border)]">
                                                <div className="text-[9px] text-[var(--color-silver)] uppercase mb-1 font-black opacity-30">{t('ma_master_200')}</div>
                                                <div className="text-[11px] text-white font-mono font-bold">${formatNumber(tf.ma200 || 0, getDecimals(tf.ma200 || 0))}</div>
                                            </div>
                                        </>
                                    ) : tf.timeframe === '1h' ? (
                                        <>
                                            <div className="bg-black/20 p-2 border-l border-[var(--color-border)]">
                                                <div className="text-[9px] text-[var(--color-silver)] uppercase mb-1 font-black opacity-30">{t('ma_flow_20')}</div>
                                                <div className="text-[11px] text-white font-mono font-bold">${formatNumber(tf.ma20, getDecimals(tf.ma20))}</div>
                                            </div>
                                            <div className="bg-black/20 p-2 border-l border-[var(--color-border)]">
                                                <div className="text-[9px] text-[var(--color-silver)] uppercase mb-1 font-black opacity-30">{t('ma_support_50')}</div>
                                                <div className="text-[11px] text-white font-mono font-bold">${formatNumber(tf.ma50 || 0, getDecimals(tf.ma50 || 0))}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-black/20 p-2 border-l border-[var(--color-border)]">
                                                <div className="text-[9px] text-[var(--color-silver)] uppercase mb-1 font-black opacity-30">{t('ma_basis')}</div>
                                                <div className="text-[11px] text-white font-mono font-bold">${formatNumber(tf.ma20, getDecimals(tf.ma20))}</div>
                                            </div>
                                            <div className="bg-black/20 p-2 border-l border-[var(--color-border)]">
                                                <div className="text-[9px] text-[var(--color-silver)] uppercase mb-1 font-black opacity-30">{t('engine_price')}</div>
                                                <div className={`text-[11px] font-mono font-bold ${tf.currentPrice > (tf.ma20 || 0) ? 'text-[var(--color-long)]' : 'text-[var(--color-short)]'}`}>
                                                    ${formatNumber(tf.currentPrice, getDecimals(tf.currentPrice))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {tf.timeframe === '15m' && tf.cross && tf.cross !== 'none' && (
                                    <div className={`mt-4 text-[9px] font-black tracking-[0.3em] text-center py-2 rounded-[1px] border border-current animate-pulse italic ${tf.cross === 'bullish_cross' ? 'bg-[var(--color-long)]/5 text-[var(--color-long)]' : 'bg-[var(--color-short)]/5 text-[var(--color-short)]'
                                        }`}>
                                        {tf.cross === 'bullish_cross' ? t('integral_cross') : t('negative_cross')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Overall Recommendation: High Energy */}
                    <div className={`mt-8 p-6 rounded-[2px] border relative overflow-hidden group ${data.overallBias === 'long'
                        ? 'bg-[var(--color-long)]/5 border-[var(--color-long)]/30 shadow-[0_0_30px_rgba(0,255,163,0.05)]'
                        : data.overallBias === 'short'
                            ? 'bg-[var(--color-short)]/5 border-[var(--color-short)]/30 shadow-[0_0_30px_rgba(255,0,51,0.05)]'
                            : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)] opacity-80'
                        }`}>
                        <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white/5 pointer-events-none"></div>
                        <div className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-[0.4em] mb-4 opacity-40">
                            {t('protocol_outcome')}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-[1px] ${data.overallBias === 'long' ? 'bg-[var(--color-long)] shadow-[0_0_15px_rgba(0,255,163,0.3)]' : data.overallBias === 'short' ? 'bg-[var(--color-short)] shadow-[0_0_15px_rgba(255,0,51,0.3)]' : 'bg-white/10'}`}>
                                    {data.overallBias === 'long' ? <TrendingUp size={22} className="text-black" /> : data.overallBias === 'short' ? <TrendingDown size={22} className="text-white" /> : <Minus size={22} className="text-white" />}
                                </div>
                                <span className={`text-4xl font-black italic tracking-tighter ${data.overallBias === 'long'
                                    ? 'text-[var(--color-long)]'
                                    : data.overallBias === 'short'
                                        ? 'text-[var(--color-short)]'
                                        : 'text-[var(--color-silver)]'
                                    }`}>
                                    {data.overallBias === 'long' ? t('order_long') : data.overallBias === 'short' ? t('order_short') : t('stand_by')}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-black text-[var(--color-silver)] tracking-[0.2em] mb-1 opacity-40">{t('probability')}</div>
                                <div className="text-3xl font-black italic text-[var(--color-flare)] tracking-tighter">
                                    {formatNumber(data.confidence, 0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!data && !loading && (
                <div className="text-center py-20 opacity-20">
                    <BarChart3 size={40} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black tracking-widest uppercase">{t('waiting_feed')}</p>
                </div>
            )}

            {isShareModalOpen && (
                <AnalysisShareModal
                    type="MA"
                    symbol={symbol}
                    data={data}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
        </div>
    );
};
