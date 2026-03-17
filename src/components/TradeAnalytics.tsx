import React, { useState } from 'react';
import { TrendingUp, BarChart2, Share2, Activity } from 'lucide-react';
import { CoinShareModal } from './CoinShareModal';
import { useTradeAnalytics, type AnalyticsData } from '../hooks/useTradeAnalytics';
import { useTranslation, type Language } from '../utils/translations';

interface TradeAnalyticsProps {
    language: Language;
}

export const TradeAnalytics: React.FC<TradeAnalyticsProps> = ({ language }) => {
    const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all');
    const { stats, lastScan, botOnline, loading } = useTradeAnalytics(timeFilter);
    const [shareModalCoin, setShareModalCoin] = useState<AnalyticsData | null>(null);
    const t = useTranslation(language);

    if (loading && stats.length === 0) {
        return (
            <div className="card p-8 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-[var(--color-flare)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Time Filter & Header Overhaul */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <BarChart2 className="text-[var(--color-flare)]" size={18} />
                    <h2 className="text-xs font-black tracking-[0.3em] text-white uppercase italic">{t('quant_analytics')}</h2>
                </div>
                <div className="flex bg-black/40 p-1 rounded-[1px] border border-white/5 shadow-inner overflow-hidden">
                    {(['all', '24h', '7d', '30d'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setTimeFilter(f)}
                            className={`px-3 py-1.5 rounded-[1px] text-[8px] font-black transition-all duration-300 uppercase tracking-widest italic ${timeFilter === f ? 'bg-[var(--color-flare)] text-white shadow-[0_0_12px_var(--color-flare)]' : 'text-[var(--color-silver)] opacity-30 hover:opacity-100 hover:bg-white/5'}`}
                        >
                            {t(f === 'all' ? 'full_logs' : f === '24h' ? 'h24_cycle' : f === '7d' ? 'd7_window' : 'd30_window')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bot Status Bar - Live Telemetry Link */}
            <div className={`p-4 rounded-[1px] border shadow-2xl transition-all duration-500 flex items-center justify-between overflow-hidden relative ${botOnline ? 'bg-[var(--color-long)]/5 border-[var(--color-long)]/30' : 'bg-[var(--color-short)]/5 border-[var(--color-short)]/30'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-scan"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                        <div className={`w-2 h-2 rounded-full ${botOnline ? 'bg-[var(--color-long)] animate-ping absolute top-0 left-0' : 'bg-[var(--color-short)]'}`}></div>
                        <div className={`w-2 h-2 rounded-full relative ${botOnline ? 'bg-[var(--color-long)]' : 'bg-[var(--color-short)]'}`}></div>
                    </div>
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic">
                        {t('system_status')}: {botOnline ? t('uplink_established') : t('uplink_critical')}
                    </span>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <div className="flex items-center gap-2 text-[8px] text-[var(--color-silver)]/40 font-mono tracking-widest italic">
                        {t('temporal_marker')}: <span className="text-white/60">{lastScan ? new Date(lastScan).toLocaleTimeString('vi-VN', { hour12: false }) : 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Insight Performance Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group bg-white/[0.02] border border-white/5 p-5 flex items-center gap-5 hover:border-[var(--color-flare)]/30 transition-all duration-700 relative overflow-hidden rounded-[1px]">
                    <div className="bg-[var(--color-long)]/10 p-3 rounded-[1px] border border-[var(--color-long)]/20 text-[var(--color-long)] group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp size={20} strokeWidth={3} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[7px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-[0.3em] mb-0.5 italic">{t('efficiency_lead')}</p>
                        <h4 className="text-lg font-black text-white tracking-widest italic font-mono">
                            {(() => {
                                const winners = stats.slice(1).filter(s => s.total >= 2 && s.wins > 0);
                                if (winners.length === 0) return '---';
                                const best = [...winners].sort((a, b) => (b.winRate - a.winRate) || (b.total - a.total))[0];
                                return best ? `${best.symbol.replace('USDT', '')} // ${best.winRate.toFixed(0)}%` : '---';
                            })()}
                        </h4>
                    </div>
                </div>

                <div className="group bg-white/[0.02] border border-white/5 p-5 flex items-center gap-5 hover:border-[var(--color-short)]/30 transition-all duration-700 relative overflow-hidden rounded-[1px]">
                    <div className="bg-[var(--color-short)]/10 p-3 rounded-[1px] border border-[var(--color-short)]/20 text-[var(--color-short)] group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp size={20} strokeWidth={3} className="rotate-180" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[7px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-[0.3em] mb-0.5 italic">{t('vector_weakness')}</p>
                        <h4 className="text-lg font-black text-white tracking-widest italic font-mono">
                            {(() => {
                                const losers = stats.slice(1).filter(s => s.total >= 2 && s.losses > 0);
                                if (losers.length === 0) return '---';
                                const worst = [...losers].sort((a, b) => (a.winRate - b.winRate) || (b.total - a.total))[0];
                                return worst ? `${worst.symbol.replace('USDT', '')} // ${worst.winRate.toFixed(0)}%` : '---';
                            })()}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Stats Summary Cards Overhauled */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {stats.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="p-5 bg-white/[0.02] border border-white/5 relative group hover:bg-white/[0.04] transition-all duration-500 rounded-[1px]">
                        <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
                            <div>
                                <p className="text-[8px] font-black text-[var(--color-flare)] uppercase tracking-[0.3em] italic mb-1">
                                    {s.symbol.includes('TẤT CẢ') || s.symbol.includes('ALL') ? t('all_rate') : s.symbol.replace('USDT', '')}
                                </p>
                                <h3 className="text-2xl font-black text-white font-mono tracking-tighter flex items-baseline gap-2">
                                    {s.winRate.toFixed(1)}% <span className="text-[7px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-widest italic">{t('success_rate')}</span>
                                </h3>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[8px] font-black italic tracking-widest">
                            <div className="space-y-0.5">
                                <span className="text-[var(--color-silver)] opacity-20 uppercase block">{t('win_label')}</span>
                                <span className="text-[var(--color-long)] font-mono">{s.wins} [W]</span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[var(--color-silver)] opacity-20 uppercase block">{t('loss_label')}</span>
                                <span className="text-[var(--color-short)] font-mono">{s.losses} [L]</span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[var(--color-silver)] opacity-20 uppercase block">{t('protected_logs')}</span>
                                <span className="text-[var(--color-flare)] font-mono">{s.protected} [P]</span>
                            </div>
                            <div className="space-y-0.5 text-right">
                                <span className="text-[var(--color-silver)] opacity-20 uppercase block">POP</span>
                                <span className="text-white/40 font-mono">N={s.total}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance by Coin - Table - Institutional Overhaul */}
            <div className="card overflow-hidden flare-border shadow-2xl">
                <div className="bg-[var(--color-bg-secondary)] py-3 px-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity size={14} className="text-[var(--color-flare)] animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white italic">{t('detailed_stats')}</span>
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar scroll-smooth">
                    <table className="w-full text-left border-collapse table-fixed lg:table-auto">
                        <thead className="bg-black/40 text-[10px] font-black text-[var(--color-silver)] uppercase tracking-wider border-b border-white/5 opacity-60 text-center">
                            <tr>
                                <th className="w-[10%] px-3 py-4 text-left">{t('asset')}</th>
                                <th className="w-[10%] px-2 py-4">{t('total_vectors')}</th>
                                <th className="w-[10%] px-2 py-4 text-[var(--color-long)]">{t('confirmed_wins')}</th>
                                <th className="w-[10%] px-2 py-4 text-[var(--color-short)]">{t('liquidated_losses')}</th>
                                <th className="w-[10%] px-2 py-4 text-[var(--color-flare)]">{t('protected_logs')}</th>
                                <th className="w-[30%] px-3 py-4">{t('efficiency_ratio')}</th>
                                <th className="w-[10%] px-3 py-4">{t('protocol')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-center">
                            {stats.slice(1, 15).map((s, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.03] transition-all duration-300 group cursor-default text-[12px]">
                                    <td className="px-3 py-4 font-black text-white tracking-tight text-left uppercase">{s.symbol.replace('USDT', '')}</td>
                                    <td className="px-2 py-4 font-black font-mono text-[var(--color-silver)] opacity-30 italic">{s.total}</td>
                                    <td className="px-2 py-4 font-black font-mono text-[var(--color-long)]/60 italic">{s.wins}</td>
                                    <td className="px-2 py-4 font-black font-mono text-[var(--color-short)]/60 italic">{s.losses}</td>
                                    <td className="px-2 py-4 font-black font-mono text-[var(--color-flare)]/60 italic">{s.protected}</td>
                                    <td className="px-3 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-12 h-1.5 bg-white/5 rounded-[1px] overflow-hidden border border-white/5">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${s.winRate >= 50 ? 'bg-[var(--color-long)]' : 'bg-[var(--color-short)]'}`}
                                                    style={{ width: `${s.winRate}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[11px] font-black text-white font-mono italic tracking-tighter">{s.winRate.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-4">
                                        <button 
                                            onClick={() => setShareModalCoin(s)} 
                                            className="p-1.5 text-[var(--color-silver)] opacity-20 hover:opacity-100 hover:text-[var(--color-flare)] transition-all hover:scale-110 duration-300"
                                        >
                                            <Share2 size={12} strokeWidth={3} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {shareModalCoin && (
                <CoinShareModal
                    symbol={shareModalCoin.symbol}
                    winRate={shareModalCoin.winRate}
                    wins={shareModalCoin.wins}
                    losses={shareModalCoin.losses}
                    total={shareModalCoin.total}
                    tfBreakdown={shareModalCoin.tfBreakdown}
                    timeFilter={timeFilter}
                    onClose={() => setShareModalCoin(null)}
                />
            )}
        </div>
    );
};
