import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface DivergencePanelProps {
    data: MAAnalysis | null;
    activeTimeframe: string;
}

export function DivergencePanel({ data, activeTimeframe }: DivergencePanelProps) {
    const tfData = data?.timeframes.find(t => t.timeframe === activeTimeframe);
    const divergence = tfData?.divergence || 'none';
    const rsi = tfData?.rsi || 0;

    const isBullish = divergence === 'bullish';
    const isBearish = divergence === 'bearish';

    return (
        <div className="card flare-border reveal shadow-2xl shadow-black/40">
            <div className="card-header border-b border-[var(--color-border)] pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <Target size={14} className="text-[var(--color-flare)]" />
                    <span className="font-black tracking-[0.2em] uppercase text-xs">Vector Divergence [{activeTimeframe === '60' ? '1H' : activeTimeframe === '240' ? '4H' : activeTimeframe + 'm'}]</span>
                </div>
            </div>

            <div className="space-y-6">
                {/* RSI Status Meter */}
                <div className="flex items-center justify-between p-4 rounded-[1px] bg-black/20 border border-[var(--color-border)] relative overflow-hidden group">
                    <div className="absolute left-0 top-0 h-full w-[2px] bg-[var(--color-flare)] opacity-30 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-[0.2em] italic opacity-60">Engine_RSI_Metric</span>
                    <span className={`text-sm font-black tracking-tighter font-mono ${rsi > 70 ? 'text-[var(--color-short)] shadowed-text' : rsi < 30 ? 'text-[var(--color-long)] shadowed-text' : 'text-white'}`}>
                        {rsi > 0 ? rsi.toFixed(2) : '--'}
                    </span>
                </div>

                {/* Main Divergence Readout */}
                <div className={`relative flex flex-col items-center justify-center p-8 rounded-[1px] border border-[var(--color-border)] transition-all duration-700 overflow-hidden ${isBullish ? 'bg-[var(--color-long)]/5 border-[var(--color-long)]/40 shadow-[inset_0_0_30px_rgba(34,197,94,0.1)]' :
                    isBearish ? 'bg-[var(--color-short)]/5 border-[var(--color-short)]/40 shadow-[inset_0_0_30px_rgba(239,68,68,0.1)]' :
                        'bg-black/20 border-white/5 opacity-40 grayscale'
                    }`}>
                    
                    {/* Background Grid Pattern for cinematic effect */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {isBullish ? (
                        <>
                            <div className="relative mb-6">
                                <TrendingUp size={48} className="text-[var(--color-long)] animate-pulse" />
                                <div className="absolute -inset-4 bg-[var(--color-long)]/20 blur-xl rounded-full -z-10 animate-pulse"></div>
                            </div>
                            <span className="text-xl font-black text-[var(--color-long)] tracking-tighter shadowed-text italic uppercase">BULLISH_CONVERGENCE</span>
                            <div className="h-[1px] w-12 bg-[var(--color-long)] my-3 opacity-40"></div>
                            <p className="text-[9px] text-[var(--color-long)] font-black tracking-[0.3em] uppercase italic">Structural Reversal Imminent</p>
                        </>
                    ) : isBearish ? (
                        <>
                            <div className="relative mb-6">
                                <TrendingDown size={48} className="text-[var(--color-short)] animate-pulse" />
                                <div className="absolute -inset-4 bg-[var(--color-short)]/20 blur-xl rounded-full -z-10 animate-pulse"></div>
                            </div>
                            <span className="text-xl font-black text-[var(--color-short)] tracking-tighter shadowed-text italic uppercase">BEARISH_DIVERGENCE</span>
                            <div className="h-[1px] w-12 bg-[var(--color-short)] my-3 opacity-40"></div>
                            <p className="text-[9px] text-[var(--color-short)] font-black tracking-[0.3em] uppercase italic">Momentum Depletion Detected</p>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={40} className="text-[var(--color-silver)] mb-4 opacity-20" />
                            <span className="text-[10px] font-black text-[var(--color-silver)] opacity-30 uppercase tracking-[0.4em] italic">Neutral_Vector_Phase</span>
                        </>
                    )}
                </div>

                {/* Lab Notes */}
                <div className="p-4 rounded-[1px] bg-black/40 border-l border-l-[var(--color-flare)]/40 text-[9px] text-[var(--color-silver)] font-medium leading-[1.6] opacity-40 italic tracking-widest uppercase">
                    * Derived from 50-period vector analysis. Correlating structural price pivots with Oscillator intensity.
                </div>
            </div>
        </div>
    );
}
