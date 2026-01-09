import React from 'react';
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { useMarketTrends } from '../hooks/useMarketTrends';

interface MarketTrendsProps {
    onSymbolSelect: (symbol: string) => void;
}

export const MarketTrends: React.FC<MarketTrendsProps> = ({ onSymbolSelect }) => {
    const { gainers, losers, loading, refetch } = useMarketTrends();

    const renderList = (coins: any[], isGainer: boolean) => (
        <div className="space-y-2">
            <div className={`flex items-center gap-2 text-xs font-bold mb-3 ${isGainer ? 'text-green-400' : 'text-red-400'}`}>
                {isGainer ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isGainer ? 'TOP TĂNG GIÁ (24H)' : 'TOP GIẢM GIÁ (24H)'}
            </div>
            {coins.map((coin) => (
                <div
                    key={coin.symbol}
                    onClick={() => onSymbolSelect(coin.symbol)}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-tertiary)] border border-transparent hover:border-[var(--color-border)] cursor-pointer transition-all group"
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-[var(--color-golden)] flex items-center gap-1">
                            {coin.symbol.replace('USDT', '')}
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                            ${parseFloat(coin.lastPrice).toLocaleString()}
                        </span>
                    </div>
                    <div className={`text-sm font-mono font-bold ${isGainer ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(coin.priceChangePercent) > 0 ? '+' : ''}{parseFloat(coin.priceChangePercent).toFixed(2)}%
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="card">
            <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--color-golden)]" />
                    BIẾN ĐỘNG THỊ TRƯỜNG (FUTURES)
                </div>
                <button
                    onClick={refetch}
                    disabled={loading}
                    className={`p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={14} className="text-[var(--color-text-secondary)]" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-[var(--color-golden)] border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {renderList(gainers, true)}
                    {renderList(losers, false)}
                </div>
            )}
        </div>
    );
};
