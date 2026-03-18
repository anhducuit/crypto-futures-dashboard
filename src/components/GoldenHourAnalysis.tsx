import { Clock, Activity } from 'lucide-react';
import { useTranslation, type Language } from '../utils/translations';

interface GoldenHourAnalysisProps {
    bestHours: Record<string, { wins: number, losses: number, protected?: number }>;
    strategyStats: Record<string, { wins: number, losses: number, protected?: number }>;
    language: Language;
}

export const GoldenHourAnalysis: React.FC<GoldenHourAnalysisProps> = ({ bestHours, strategyStats, language }) => {
    const t = useTranslation(language);
    return (
        <div className="card">
            <div className="card-header flex justify-between items-center bg-[var(--color-bg-secondary)] p-4">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[var(--color-golden)]" />
                    <span className="font-bold tracking-tight uppercase">{t('golden_hour_title')}</span>
                </div>
            </div>
            
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(bestHours).map(([session, counts]) => {
                    const total = counts.wins + counts.losses;
                    const rate = total > 0 ? (counts.wins / total * 100) : 0;
                    return (
                        <div key={session} className="bg-black/20 p-3 rounded-[1px] border border-white/5 text-center">
                            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">{t(`session_${session.toLowerCase()}` as any)}</p>
                            <p className={`text-lg font-black ${rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{rate.toFixed(0)}%</p>
                            <div className="mt-2 text-[10px] flex justify-center gap-2">
                                <span className="text-green-500">{t('win_label')[0]}:{counts.wins}</span>
                                <span className="text-red-500">{t('loss_label')[0]}:{counts.losses}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-[var(--color-golden)] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={14} />
                        {t('combo_perf')}
                    </h3>
                    <span className="text-[9px] text-slate-500 font-bold px-2 py-0.5 bg-white/5 border border-white/10 rounded-full uppercase">Unified Orchestrator v2</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {Object.entries(strategyStats)
                    .filter(([s]) => s !== 'C5:')
                    .sort(([a], [b]) => {
                        const scores: any = { 'C2:': 100, 'C4:': 90, 'C1:': 80, 'C3:': 75, 'C6:': 70 };
                        return (scores[b] || 0) - (scores[a] || 0);
                    })
                    .map(([strategy, counts]) => {
                        const total = counts.wins + counts.losses + (counts.protected || 0);
                        const rate = (counts.wins + counts.losses) > 0 ? (counts.wins / (counts.wins + counts.losses) * 100) : 0;
                        const displayTitle = t('strat_liquidity_trap', strategy);
                        
                        const meta: any = {
                            'C2:': { score: 100, risk: '3.0%', label: 'TREND KING' },
                            'C4:': { score: 90, risk: '2.0%', label: 'MOMENTUM' },
                            'C1:': { score: 80, risk: '1.0%', label: 'REVERSAL' },
                            'C3:': { score: 75, risk: '1.0%', label: 'FAKEOUT' },
                            'C6:': { score: 70, risk: '1.0%', label: 'STRUCTURE' },
                        };
                        const info = meta[strategy] || { score: 0, risk: '0%', label: 'UNKNOWN' };

                        return (
                            <div key={strategy} className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] p-4 rounded-[2px] border border-white/5 hover:border-[var(--color-golden)]/30 transition-all duration-300">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm mb-1 w-fit ${
                                            info.score >= 90 ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {info.score} ĐIỂM
                                        </span>
                                        <p className="text-[10px] text-slate-300 font-black leading-tight uppercase tracking-tight min-h-[32px]">
                                            {displayTitle}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-500 font-black">{info.risk}</p>
                                        <p className="text-[7px] text-slate-600 font-bold">RISK</p>
                                    </div>
                                </div>

                                <div className="flex items-end gap-2 mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-end gap-1.5 leading-none">
                                            <p className={`text-2xl font-black ${rate >= 50 ? 'text-green-400' : (total > 0 ? 'text-red-400' : 'text-slate-600')}`}>
                                                {total > 0 ? `${rate.toFixed(0)}%` : '--'}
                                            </p>
                                            <span className="text-[8px] text-slate-500 font-bold mb-1">WINRATE</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between gap-1 text-[9px] mt-3 pt-3 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-slate-600 font-bold uppercase tracking-tighter">SUCCESS</span>
                                        <span className="text-green-500 font-bold">{counts.wins}</span>
                                    </div>
                                    <div className="flex flex-col text-center">
                                        <span className="text-slate-600 font-bold uppercase tracking-tighter">FAILED</span>
                                        <span className="text-red-500 font-bold">{counts.losses}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-slate-600 font-bold uppercase tracking-tighter">TOTAL</span>
                                        <span className="text-white/40 font-bold">{total}</span>
                                    </div>
                                </div>
                                
                                {rate >= 70 && total >= 3 && (
                                    <div className="absolute top-2 right-2 w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-4 pb-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-[1px] p-3">
                    <p className="text-[10px] text-blue-300 italic">
                        💡 {t('robot_tip')}
                    </p>
                </div>
            </div>
        </div>
    );
};
