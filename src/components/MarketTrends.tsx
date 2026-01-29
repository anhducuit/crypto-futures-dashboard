import React from 'react';
import { TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import { useMarketTrends } from '../hooks/useMarketTrends';

interface MarketTrendsProps {
    onSymbolSelect: (symbol: string) => void;
}

export const MarketTrends: React.FC<MarketTrendsProps> = ({ onSymbolSelect }) => {
    const { gold, silver, loading, refetch } = useMarketTrends();

    const renderAsset = (coin: any, title: string, color: string) => {
        if (!coin) return null;
        const isPositive = parseFloat(coin.priceChangePercent) >= 0;

        return (
            <div
                onClick={() => onSymbolSelect(coin.symbol)}
                className="relative overflow-hidden p-4 rounded-xl bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-tertiary)] border border-white/5 hover:border-[var(--color-golden)]/30 cursor-pointer transition-all group"
            >
                {/* Background Glow */}
                <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${color === 'gold' ? 'bg-yellow-500' : 'bg-slate-400'}`}></div>

                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
                        <span className={`text-xl font-black tracking-tighter ${color === 'gold' ? 'text-[var(--color-golden)]' : 'text-slate-300'}`}>
                            {coin.symbol.replace('USDT', '')}
                        </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-black ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {isPositive ? '+' : ''}{parseFloat(coin.priceChangePercent).toFixed(2)}%
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-bold leading-none mb-1">Price</span>
                        <span className="text-lg font-mono font-black text-white">
                            ${parseFloat(coin.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                        <ExternalLink size={14} className="text-slate-500" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <div className="card-header justify-between bg-black/40">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--color-golden)]" />
                    <span className="font-black tracking-tight uppercase">BIẾN ĐỘNG THỊ TRƯỜNG VÀNG & BẠC</span>
                </div>
                <button
                    onClick={refetch}
                    disabled={loading}
                    className={`p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={14} className="text-[var(--color-text-secondary)]" />
                </button>
            </div>

            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-[var(--color-golden)] border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {renderAsset(gold, 'Gold Spot', 'gold')}
                        {renderAsset(silver, 'Silver Spot', 'silver')}
                    </div>
                )}

                <div className="mt-3 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <p className="text-[9px] text-blue-400 font-bold italic text-center">
                        💡 Tín hiệu Vàng/Bạc được tích hợp trực tiếp vào Bot 1 & Bot 2.
                    </p>
                </div>
            </div>
        </div>
    );
};
