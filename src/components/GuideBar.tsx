import React, { useState } from 'react';
import { HelpCircle, Zap, BarChart3, Layers, TrendingUp, Sparkles, Activity, Target, PieChart, Swords } from 'lucide-react';
import { GuideModal } from './GuideModal';
import type { GuideType } from './GuideModal';
import { useTranslation, type Language } from '../utils/translations';

interface GuideBarProps {
    language: Language;
}

export const GuideBar: React.FC<GuideBarProps> = ({ language }) => {
    const [activeGuide, setActiveGuide] = useState<GuideType | null>(null);
    const t = useTranslation(language);

    const guides: { id: GuideType; label: string; icon: React.ReactNode; color: string }[] = [
        { id: 'COMBO_STRATEGIES', label: t('combo_strategies_guide'), icon: <Swords size={14} />, color: 'text-red-500' },
        { id: 'MA_CROSS', label: t('ma_cross_guide'), icon: <Zap size={14} />, color: 'text-blue-400' },
        { id: 'VOLUME', label: t('volume_guide'), icon: <BarChart3 size={14} />, color: 'text-orange-400' },
        { id: 'MULTI_TF_MA', label: t('multi_tf_ma_guide'), icon: <Layers size={14} />, color: 'text-purple-400' },
        { id: 'EMA_TREND', label: t('ema_trend_guide'), icon: <TrendingUp size={14} />, color: 'text-emerald-400' },
        { id: 'ICHIMOKU', label: t('ichimoku_guide'), icon: <Sparkles size={14} />, color: 'text-indigo-400' },
        { id: 'DIVERGENCE', label: t('divergence_guide'), icon: <Activity size={14} />, color: 'text-pink-400' },
        { id: 'KEY_LEVELS', label: t('key_levels_guide'), icon: <Target size={14} />, color: 'text-yellow-400' },
        { id: 'FIBONACCI', label: t('fibonacci_guide'), icon: <Sparkles size={14} />, color: 'text-amber-500' },
        { id: 'ANALYTICS', label: t('analytics_guide'), icon: <PieChart size={14} />, color: 'text-cyan-400' },
        { id: 'ANOMALY', label: t('anomaly_guide'), icon: <Activity size={14} />, color: 'text-pink-400' },
    ];

    return (
        <>
            <div className="bg-[var(--color-bg-secondary)]/50 border-b border-[var(--color-border)] py-2 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="w-full flex items-center gap-3 min-w-max px-4">
                    <div className="flex items-center gap-2 pr-4 border-r border-[var(--color-border)]">
                        <HelpCircle size={16} className="text-[var(--color-golden)]" />
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('guide')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {guides.map((g) => (
                            <button
                                key={g.id}
                                onClick={() => setActiveGuide(g.id)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group scale-100 active:scale-95"
                            >
                                <span className={`${g.color} group-hover:scale-110 transition-transform`}>
                                    {g.icon}
                                </span>
                                <span className="text-[10px] font-bold text-gray-300 group-hover:text-white transition-colors uppercase whitespace-nowrap">
                                    {g.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeGuide && (
                <GuideModal
                    type={activeGuide}
                    onClose={() => setActiveGuide(null)}
                    language={language}
                />
            )}
        </>
    );
};
