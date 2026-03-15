import { TrendingUp, TrendingDown, BarChart2, AlertTriangle, RefreshCw } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';
import { useTranslation, type Language } from '../utils/translations';

interface AnalysisGlobalControlsProps {
    symbol: string;
    onSymbolChange: (symbol: string) => void;
    activeTimeframe: string;
    onTimeframeChange: (tf: string) => void;
    direction: 'long' | 'short';
    onDirectionChange: (dir: 'long' | 'short') => void;
    maAnalysis: MAAnalysis | null;
    language: Language;
}

export const AnalysisGlobalControls: React.FC<AnalysisGlobalControlsProps> = ({
    symbol,
    onSymbolChange,
    activeTimeframe,
    onTimeframeChange,
    direction,
    onDirectionChange,
    maAnalysis,
    language
}) => {
    const t = useTranslation(language);
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'NEARUSDT', 'TIAUSDT'];
    const timeframes = [
        { id: '1', label: '1M' },
        { id: '15', label: '15M' },
        { id: '60', label: '1H' },
        { id: '240', label: '4H' }
    ];

    return (
        <div className="card flare-border !p-8 reveal shadow-2xl shadow-black/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                
                {/* Left Cluster: Instrument & Resolution */}
                <div className="flex flex-wrap items-center gap-10">
                    {/* Instrument Selector */}
                    <div className="flex flex-col">
                        <h2 className="text-[10px] font-black text-[var(--color-flare)] tracking-[0.3em] mb-3 uppercase">{t('protocol')}</h2>
                        <div className="flex items-center gap-3 bg-[var(--color-bg-tertiary)] p-1.5 rounded-[2px] border border-[var(--color-border)]">
                            <div className="relative group">
                                <select 
                                    value={symbol}
                                    onChange={(e) => onSymbolChange(e.target.value)}
                                    className="bg-transparent pl-4 pr-8 py-1.5 text-lg font-black text-white outline-none cursor-pointer appearance-none transition-colors hover:text-[var(--color-flare)]"
                                >
                                    {symbols.map(s => (
                                        <option key={s} value={s} className="bg-[var(--color-bg-secondary)] text-white">
                                            {s.replace('USDT', '')}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-silver)] opacity-50">
                                    <BarChart2 size={12} className="rotate-90" />
                                </div>
                            </div>
                            <button 
                                onClick={() => onSymbolChange(symbol)}
                                className="p-2 text-[var(--color-silver)] hover:text-white transition-colors border-l border-[var(--color-border)]"
                                title="Sync Engine"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="w-[1px] h-12 bg-[var(--color-border)] hidden xl:block"></div>

                    {/* Resolution Selector */}
                    <div className="flex flex-col">
                        <h2 className="text-[10px] font-black text-[var(--color-silver)] tracking-[0.3em] mb-3 uppercase opacity-50">{t('resolution')}</h2>
                        <div className="flex p-1 bg-[var(--color-bg-tertiary)] rounded-[2px] border border-[var(--color-border)]">
                            {timeframes.map((tf) => (
                                <button
                                    key={tf.id}
                                    onClick={() => onTimeframeChange(tf.id)}
                                    className={`px-5 py-2 rounded-[2px] text-[10px] font-black tracking-widest transition-all duration-300 ${
                                        activeTimeframe === tf.id
                                            ? 'bg-[var(--color-white)] text-black shadow-lg shadow-white/5'
                                            : 'text-[var(--color-silver)] hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Cluster: Bias & Integrity */}
                <div className="flex flex-wrap items-center gap-10">
                    {/* Direction Selection */}
                    <div className="flex flex-col">
                        <h2 className="text-[10px] font-black text-[var(--color-silver)] tracking-[0.3em] mb-3 uppercase opacity-50">{t('active_bias')}</h2>
                        <div className="flex p-1 bg-[var(--color-bg-tertiary)] rounded-[2px] border border-[var(--color-border)]">
                            <button
                                onClick={() => onDirectionChange('long')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-[2px] text-[10px] font-black tracking-widest transition-all duration-500 ${
                                    direction === 'long'
                                        ? 'bg-[var(--color-long)] text-black shadow-lg shadow-green-500/10'
                                        : 'text-[var(--color-silver)] hover:text-[var(--color-long)]'
                                }`}
                            >
                                <TrendingUp size={14} />
                                BULLISH
                            </button>
                            <button
                                onClick={() => onDirectionChange('short')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-[2px] text-[10px] font-black tracking-widest transition-all duration-500 ${
                                    direction === 'short'
                                        ? 'bg-[var(--color-short)] text-white shadow-lg shadow-red-500/10'
                                        : 'text-[var(--color-silver)] hover:text-[var(--color-short)]'
                                }`}
                            >
                                <TrendingDown size={14} />
                                BEARISH
                            </button>
                        </div>
                    </div>

                    {/* Conflict Telemetry */}
                    {maAnalysis && maAnalysis.overallBias !== 'neutral' && maAnalysis.overallBias !== direction && (
                        <div className="flex flex-col lg:min-w-[240px]">
                            <h2 className="text-[10px] font-black text-[var(--color-short)] tracking-[0.3em] mb-3 uppercase animate-pulse">{t('integrity_warning')}</h2>
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-red-500/5 border border-red-500/20 rounded-[2px]">
                                <AlertTriangle size={14} className="text-[var(--color-short)] animate-bounce" />
                                <div className="text-[10px] uppercase font-black tracking-tight">
                                    <span className="text-[var(--color-short)]">{t('bias_mismatch')}: </span>
                                    <span className="text-white opacity-80">{t('robot_suggests')} {maAnalysis.overallBias}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
