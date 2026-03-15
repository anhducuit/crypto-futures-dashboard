import React from 'react';
import { TrendingUp, RefreshCw, Activity } from 'lucide-react';
import { useMarketTrends } from '../hooks/useMarketTrends';
import { useTranslation, type Language } from '../utils/translations';

interface MarketTrendsProps {
    onSymbolSelect: (symbol: string) => void;
    language: Language;
}

export const MarketTrends: React.FC<MarketTrendsProps> = ({ onSymbolSelect, language }) => {
    const { gold, silver, loading, refetch } = useMarketTrends();
    const t = useTranslation(language);

    const renderAsset = (coin: any, titleKey: any, color: 'gold' | 'silver', idx: number) => {
        if (!coin) return null;
        const isPositive = parseFloat(coin.priceChangePercent) >= 0;

        return (
            <div
                onClick={() => onSymbolSelect(coin.symbol)}
                className="group relative overflow-hidden p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--color-flare)]/30 cursor-pointer transition-all duration-700 reveal rounded-[1px]"
                style={{ animationDelay: `${idx * 0.15}s` }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-flare)]/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="absolute top-2 right-2 text-[8px] font-black text-white/5 uppercase tracking-widest font-mono select-none">TECHNICAL_ASSET_LOG</div>

                <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-2 relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[var(--color-silver)] opacity-30 uppercase tracking-[0.3em] italic mb-1">{t(titleKey)}</span>
                        <h4 className={`text-2xl font-black italic tracking-tighter ${color === 'gold' ? 'text-[var(--color-flare)] shadowed-text' : 'text-white'}`}>
                            {coin.symbol.replace('USDT', '')}
                        </h4>
                    </div>
                    <div className={`px-2 py-0.5 border border-current bg-white/5 text-[10px] font-black italic tracking-widest ${isPositive ? 'text-[var(--color-long)] shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'text-[var(--color-short)] shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
                        {isPositive ? '+' : ''}{parseFloat(coin.priceChangePercent).toFixed(2)}%
                    </div>
                </div>

                <div className="flex items-end justify-between relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-[0.4em] mb-1">{t('price')}</span>
                        <div className="flex items-baseline gap-2">
                             <span className="text-xl font-mono font-black text-white tracking-widest group-hover:text-[var(--color-flare)] transition-colors">
                                ${parseFloat(coin.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--color-flare)] opacity-20 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                        <Activity size={12} strokeWidth={3} className="animate-pulse" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card flare-border shadow-2xl reveal relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-flare)]/30 to-transparent animate-scan italic opacity-20 pointer-events-none"></div>
            
            <div className="card-header justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-3">
                    <TrendingUp size={14} className="text-[var(--color-flare)]" />
                    <span className="text-xs font-black tracking-[0.2em] uppercase text-white italic">{t('market_trends')}</span>
                </div>
                <button
                    onClick={refetch}
                    disabled={loading}
                    className={`p-2 bg-white/5 border border-white/10 text-[var(--color-silver)] hover:text-[var(--color-flare)] hover:border-[var(--color-flare)]/50 transition-all rounded-[1px] ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="pt-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="animate-spin w-6 h-6 border-2 border-[var(--color-flare)] border-t-transparent rounded-full shadow-[0_0_15px_var(--color-flare)]"></div>
                        <span className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-[0.4em] italic opacity-30">Synchronizing_Market_Vectors</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderAsset(gold, 'gold_spot', 'gold', 0)}
                        {renderAsset(silver, 'silver_spot', 'silver', 1)}
                    </div>
                )}

                <div className="mt-4 flex items-start gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-[1px]">
                    <Activity size={14} className="text-[var(--color-flare)] shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[10px] text-[var(--color-silver)] font-medium italic uppercase tracking-widest leading-relaxed opacity-50">
                        {t('bot_integration_hint')}
                    </p>
                </div>
            </div>
        </div>
    );
};
