import React from 'react';
import { X, BookOpen, Zap, BarChart3, Layers, TrendingUp, Target, Sparkles, Activity, ShieldCheck, ChevronRight, Swords } from 'lucide-react';

import { useTranslation, type Language } from '../utils/translations';

export type GuideType =
    | 'COMBO_STRATEGIES'
    | 'MA_CROSS'
    | 'VOLUME'
    | 'MULTI_TF_MA'
    | 'EMA_TREND'
    | 'ICHIMOKU'
    | 'DIVERGENCE'
    | 'KEY_LEVELS'
    | 'FIBONACCI'
    | 'ANALYTICS'
    | 'ANOMALY';

interface GuideModalProps {
    type: GuideType;
    onClose: () => void;
    language: Language;
}

export const GuideModal: React.FC<GuideModalProps> = ({ type, onClose, language }) => {
    const t = useTranslation(language);
    const renderContent = () => {
        switch (type) {
            case 'COMBO_STRATEGIES':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                <Swords size={18} /> {t('combo_strategies_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('combo_strategies_desc')}
                            </p>
                        </div>

                        {/* Combo 1 */}
                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                            <h4 className="text-purple-400 font-black mb-2 flex items-center gap-2">
                                {t('combo1_title')}
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>{t('target')}:</b> {t('combo1_purpose')}
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-purple-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo1_step1')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-purple-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo1_step2')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-purple-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo1_step3')}</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-purple-500/10 rounded-lg border-l-2 border-purple-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 {t('combo1_tip')}
                                </p>
                            </div>
                        </div>

                        {/* Combo 2 */}
                        <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                            <h4 className="text-green-400 font-black mb-2 flex items-center gap-2">
                                {t('combo2_title')}
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>{t('target')}:</b> {t('combo2_purpose')}
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-green-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo2_step1')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-green-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo2_step2')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-green-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo2_step3')}</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-green-500/10 rounded-lg border-l-2 border-green-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 {t('combo2_tip')}
                                </p>
                            </div>
                        </div>

                        {/* Combo 3 */}
                        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl">
                            <h4 className="text-orange-400 font-black mb-2 flex items-center gap-2">
                                {t('combo3_title')}
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>{t('target')}:</b> {t('combo3_purpose')}
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-orange-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo3_step1')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-orange-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo3_step2')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-orange-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo3_step3')}</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-orange-500/10 rounded-lg border-l-2 border-orange-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 {t('combo3_tip')}
                                </p>
                            </div>
                        </div>

                        {/* Combo 4 */}
                        <div className="p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl">
                            <h4 className="text-red-400 font-black mb-2 flex items-center gap-2">
                                {t('combo4_title')}
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>{t('target')}:</b> {t('combo4_purpose')}
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-red-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo4_step1')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-red-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo4_step2')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-red-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo4_step3')}</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-red-500/10 rounded-lg border-l-2 border-red-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 {t('combo4_tip')}
                                </p>
                            </div>
                        </div>

                        {/* Combo 5 */}
                        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                            <h4 className="text-blue-400 font-black mb-2 flex items-center gap-2">
                                {t('combo5_title')}
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>{t('target')}:</b> {t('combo5_purpose')}
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo5_step1')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo5_step2')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo5_step3')}</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border-l-2 border-blue-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 {t('combo5_tip')}
                                </p>
                            </div>
                        </div>

                        {/* Combo 6 */}
                        <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl">
                            <h4 className="text-emerald-400 font-black mb-2 flex items-center gap-2">
                                {t('combo6_title')}
                            </h4>
                            <p className="text-xs text-gray-300 mb-3">
                                <b>{t('target')}:</b> {t('combo6_purpose')}
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-emerald-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo6_step1')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-emerald-400 mt-0.5" />
                                    <span className="text-gray-400">{t('combo6_step2')}</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg border-l-2 border-emerald-500">
                                <p className="text-[10px] text-gray-400 italic">
                                    💡 {t('combo6_tip')}
                                </p>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                            <p className="text-xs font-bold text-yellow-400 mb-2 uppercase">⚠️ {t('guide_note_title')}</p>
                            <ul className="space-y-1 text-[10px] text-gray-400">
                                <li>• {t('guide_note_1')}</li>
                                <li>• {t('guide_note_2')}</li>
                                <li>• {t('guide_note_3')}</li>
                            </ul>
                        </div>
                    </div>
                );
            case 'MA_CROSS':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                <Zap size={18} /> {t('ma_cross_how_it_works')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('ma_cross_desc')}
                            </p>
                            <ul className="mt-3 space-y-2 text-xs text-gray-400">
                                <li className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-500 mt-0.5" />
                                    <span>{t('ma_cross_scalping')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ChevronRight size={14} className="text-blue-500 mt-0.5" />
                                    <span>{t('ma_cross_safe')}</span>
                                </li>
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-[10px] font-bold text-green-400 mb-1 uppercase">{t('bullish_cross_title')}</p>
                                <p className="text-xs text-gray-400">{t('bullish_cross_desc')}</p>
                            </div>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-[10px] font-bold text-red-400 mb-1 uppercase">{t('bearish_cross_title')}</p>
                                <p className="text-xs text-gray-400">{t('bearish_cross_desc')}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'VOLUME':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <h3 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                                <BarChart3 size={18} /> {t('volume_ratio_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('volume_ratio_desc')}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-500 font-bold text-xs">&gt; 1.5x</div>
                                <div className="text-xs text-gray-300"><b>{t('vol_breakout_label')}:</b> {t('vol_breakout_desc')}</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 font-bold text-xs">0.8x - 1.2x</div>
                                <div className="text-xs text-gray-300"><b>{t('vol_stable_label')}:</b> {t('vol_stable_desc')}</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="p-2 bg-red-500/20 rounded-lg text-red-500 font-bold text-xs">&lt; 0.5x</div>
                                <div className="text-xs text-gray-300"><b>{t('vol_exhaustion_label')}:</b> {t('vol_exhaustion_desc')}</div>
                            </div>
                        </div>
                    </div>
                );
            case 'MULTI_TF_MA':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                                <Layers size={18} /> {t('mtf_analysis_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('mtf_analysis_rule')}: <b>"{t('mtf_analysis_rule_quote')}"</b>. {t('mtf_analysis_desc')}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="p-3 bg-white/5 rounded-lg border-l-4 border-purple-500">
                                <p className="text-xs font-bold text-white uppercase">{t('overall_bias')}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{t('overall_bias_desc_long')}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border-l-4 border-yellow-500">
                                <p className="text-xs font-bold text-white uppercase">{t('confidence')} (%)</p>
                                <p className="text-[10px] text-gray-400 mt-1">{t('confidence_desc_long')}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'EMA_TREND':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                                <TrendingUp size={18} /> {t('ema_trend_bias_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('ema_trend_bias_desc')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex justify-between p-2 rounded-lg bg-green-500/5">
                                <span className="text-green-500 font-bold">{t('price_gt_ema200')}</span>
                                <span className="text-gray-400">{t('bullish_trend_long')}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded-lg bg-red-500/5">
                                <span className="text-red-500 font-bold">{t('price_lt_ema200')}</span>
                                <span className="text-gray-400">{t('bearish_trend_long')}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded-lg bg-yellow-500/5">
                                <span className="text-yellow-500 font-bold">GAP (%)</span>
                                <span className="text-gray-400">{t('ema_gap_desc_long')}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'ICHIMOKU':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                <Sparkles size={18} /> {t('ichimoku_cloud_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('ichimoku_cloud_desc')}
                            </p>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-400">
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                                <span><b>{t('above_cloud_label')}:</b> {t('above_cloud_desc')}</span>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                                <span><b>{t('below_cloud_label')}:</b> {t('below_cloud_desc')}</span>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5"></div>
                                <span><b>{t('inside_cloud_label')}:</b> {t('inside_cloud_desc')}</span>
                            </li>
                            <li className="flex gap-2 border-t border-white/5 pt-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                                <span><b>{t('tenkan_gt_kijun_label')}:</b> {t('tenkan_gt_kijun_desc')}</span>
                            </li>
                        </ul>
                    </div>
                );
            case 'DIVERGENCE':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                            <h3 className="text-pink-400 font-bold mb-2 flex items-center gap-2">
                                <Activity size={18} /> {t('rsi_divergence_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('rsi_divergence_desc')}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-xs font-bold text-green-400 uppercase">{t('bullish_div_title_long')}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{t('bullish_div_desc_long')}</p>
                            </div>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-xs font-bold text-red-400 uppercase">{t('bearish_div_title_long')}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{t('bearish_div_desc_long')}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'KEY_LEVELS':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                <Target size={18} /> {t('pivot_points_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('pivot_points_desc')}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                <span className="block text-red-400 font-bold mb-1">{t('resistance_label')}</span>
                                <span className="text-[10px] text-gray-400">{t('resistance_desc_long')}</span>
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                <span className="block text-green-400 font-bold mb-1">{t('support_label')}</span>
                                <span className="text-[10px] text-gray-400">{t('support_desc_long')}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-400 mb-1 uppercase">{t('decision_strategy_long')}</p>
                            <p className="text-xs text-gray-400 italic">{t('decision_tip_long')}</p>
                        </div>
                    </div>
                );
            case 'FIBONACCI':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-600/10 border border-amber-600/20 rounded-xl">
                            <h3 className="text-amber-500 font-bold mb-2 flex items-center gap-2">
                                <Sparkles size={18} /> {t('fibonacci_tool_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('fibonaci_tool_desc')}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-[var(--color-golden)]/10 border border-[var(--color-golden)]/20 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[var(--color-golden)] uppercase italic">{t('fib_golden_zone')}</p>
                                    <p className="text-[10px] text-gray-400">{t('fib_level')} 0.5 - 0.618</p>
                                </div>
                                <span className="text-[10px] text-gray-400 text-right">{t('golden_zone_desc_long')}</span>
                            </div>
                            <div className="text-xs text-gray-400 p-2 border-l-2 border-white/20 ml-2">
                                <p>• <b>0.236 / 0.382:</b> {t('fib_shallow_desc_long')}</p>
                                <p className="mt-1">• <b>0.786:</b> {t('fib_deep_desc_long')}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'ANALYTICS':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                            <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                                <BarChart3 size={18} /> {t('trading_analytics_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('trading_analytics_desc')}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="p-2 border border-white/5 rounded-lg">
                                <p className="text-white/40 uppercase font-bold mb-1">{t('success_rate')}</p>
                                <p className="text-gray-300">{t('win_rate_desc_long')}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'ANOMALY':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                            <h3 className="text-pink-400 font-bold mb-2 flex items-center gap-2">
                                <Activity size={18} /> {t('anomaly_detection_title')}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {t('anomaly_detection_desc')}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-blue-400 mb-2 uppercase">{t('anomaly_metrics_title')}</p>
                                <ul className="space-y-2 text-[11px] text-gray-400">
                                    <li className="flex gap-2">
                                        <b className="text-white min-w-[60px]">{t('anomaly_n_label')}:</b>
                                        <span>{t('anomaly_n_desc')}</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <b className="text-white min-w-[60px]">{t('anomaly_recovery_rate')}:</b>
                                        <span>{t('anomaly_recovery_rate_desc')}</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <b className="text-white min-w-[60px]">{t('anomaly_avg_recovery_label')}:</b>
                                        <span>{t('anomaly_avg_recovery_desc')}</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-yellow-500 mb-2 uppercase">{t('anomaly_states_title_long')}</p>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-black rounded uppercase">{t('anomaly_tracking_label')}</div>
                                        <p className="text-[10px] text-gray-400"><b>{t('anomaly_tracking_label')}:</b> {t('anomaly_tracking_desc_long')}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-black rounded uppercase">{t('anomaly_recovered_label')}</div>
                                        <p className="text-[10px] text-gray-400"><b>{t('anomaly_recovered_label')}:</b> {t('anomaly_recovered_desc_long')}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 px-1.5 py-0.5 bg-gray-500/20 text-gray-400 text-[9px] font-black rounded uppercase">{t('anomaly_no_recovery_label')}</div>
                                        <p className="text-[10px] text-gray-400"><b>{t('anomaly_no_recovery_label')}:</b> {t('anomaly_no_recovery_desc_long')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-cyan-400 mb-2 uppercase">{t('anomaly_timer_title_long')}</p>
                                <ul className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                                    <li>• {t('tf_1m_timer')}</li>
                                    <li>• {t('tf_15m_timer')}</li>
                                    <li>• {t('tf_1h_timer')}</li>
                                    <li>• {t('tf_4h_timer')}</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-400 mb-1 uppercase">{t('anomaly_trigger_mechanism')}</p>
                            <p className="text-[10px] text-gray-400 italic">"{t('anomaly_trigger_desc_long')}"</p>
                        </div>
                    </div>
                );
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'COMBO_STRATEGIES': return t('combo_strategies_guide');
            case 'MA_CROSS': return t('ma_cross_guide');
            case 'VOLUME': return t('volume_guide');
            case 'MULTI_TF_MA': return t('multi_tf_ma_guide');
            case 'EMA_TREND': return t('ema_trend_guide');
            case 'ICHIMOKU': return t('ichimoku_guide');
            case 'DIVERGENCE': return t('divergence_guide');
            case 'KEY_LEVELS': return t('key_levels_guide');
            case 'FIBONACCI': return t('fibonacci_guide');
            case 'ANALYTICS': return t('analytics_guide');
            case 'ANOMALY': return t('anomaly_guide');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-gradient-to-r from-blue-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-golden)] text-black rounded-lg">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h2 className="font-black uppercase text-sm tracking-tight">{getTitle()}</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('guide_modal_subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {renderContent()}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase italic">
                        <ShieldCheck size={14} className="text-green-500" />
                        {t('trading_pro_knowledge')}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[var(--color-bg-tertiary)] hover:bg-white/10 text-white rounded-xl font-bold transition-all text-xs"
                    >
                        {t('got_it')}
                    </button>
                </div>
            </div>
        </div>
    );
};
