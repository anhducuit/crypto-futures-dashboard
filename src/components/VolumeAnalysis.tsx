import React, { useState } from 'react';
import { BarChart3, Activity, Share2 } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';
import { AnalysisShareModal } from './AnalysisShareModal';
import { useTranslation, type Language } from '../utils/translations';

interface VolumeAnalysisProps {
    symbol: string;
    maAnalysis: MAAnalysis | null;
    language: Language;
}

export const VolumeAnalysis: React.FC<VolumeAnalysisProps> = ({ symbol, maAnalysis, language }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const t = useTranslation(language);

    if (!maAnalysis) return null;

    return (
        <div className="reveal">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <BarChart3 size={14} className="text-[var(--color-flare)]" />
                    <span className="font-black tracking-[0.2em] uppercase text-[10px] text-white italic">{t('volume_analysis_title')}</span>
                </div>
                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 text-[var(--color-silver)] hover:text-[var(--color-flare)] transition-all duration-300"
                >
                    <Share2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {maAnalysis.timeframes.map((tf, idx) => {
                    const isSurge = tf.volumeRatio > 1.5;
                    const isWeak = tf.volumeRatio < 0.7;

                    return (
                        <div
                            key={tf.timeframe}
                            className="group p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--color-flare)]/30 transition-all duration-700 reveal rounded-[1px] relative overflow-hidden"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-black tracking-[0.1em] text-[10px] text-white italic uppercase">{tf.label}</span>
                                </div>
                                <span className={`text-[8px] font-black tracking-[0.1em] italic uppercase px-1.5 py-0.5 border border-current bg-white/5 ${isSurge ? 'text-[var(--color-long)]' : isWeak ? 'text-[var(--color-short)]' : 'text-[var(--color-silver)] opacity-40'}`}>
                                    {isSurge ? t('signal_surge') : isWeak ? t('signal_fade') : t('signal_stable')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="space-y-0.5">
                                    <span className="text-[7px] font-black text-[var(--color-silver)] uppercase tracking-widest opacity-20">{t('load_ratio')}</span>
                                    <div className="flex items-end gap-1">
                                        <span className={`text-base font-black font-mono tracking-tighter ${isSurge ? 'text-[var(--color-long)]' : isWeak ? 'text-[var(--color-short)]' : 'text-white'}`}>
                                            {tf.volumeRatio.toFixed(2)}
                                        </span>
                                        <span className="text-[10px] font-bold text-[var(--color-silver)] opacity-20 italic mb-1">X</span>
                                    </div>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <span className="text-[7px] font-black text-[var(--color-silver)] uppercase tracking-widest opacity-20">{t('engine_rsi')}</span>
                                    <div className="font-mono font-black text-sm tracking-widest text-white">
                                        {tf.rsi.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-3 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 h-[2px] bg-white/5 relative overflow-hidden flex mr-3">
                                        <div
                                            className={`h-full transition-all duration-1500 relative ${isSurge ? 'bg-[var(--color-long)] shadow-[0_0_8px_var(--color-long)]' : isWeak ? 'bg-[var(--color-short)] shadow-[0_0_8px_var(--color-short)]' : 'bg-[var(--color-flare)] opacity-60'}`}
                                            style={{ width: `${Math.min(tf.volumeRatio * 30, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-[8px] font-black tracking-widest italic shrink-0">
                                        <span className="text-[var(--color-silver)] opacity-20 mr-1">{t('gap_offset')}</span>
                                        <span className={`font-mono ${tf.priceGap > 0 ? 'text-[var(--color-long)]' : 'text-[var(--color-short)]'}`}>
                                            {tf.priceGap > 0 ? '+' : ''}{tf.priceGap.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 flex items-start gap-4 p-4 bg-black/40 rounded-[1px] border border-white/5">
                <Activity size={14} className="text-[var(--color-flare)] shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                    <span className="text-[9px] font-black text-[var(--color-flare)] uppercase tracking-[0.4em] italic block mb-1">{t('intelligence_directive')}</span>
                    <p className="text-[9px] text-[var(--color-silver)] font-medium leading-relaxed uppercase tracking-widest opacity-40">
                        {t('volume_hint')}
                    </p>
                </div>
            </div>

            {isShareModalOpen && (
                <AnalysisShareModal
                    type="VOLUME"
                    symbol={symbol}
                    data={maAnalysis}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
        </div>
    );
};
