import React from 'react';
import { useBinanceTicker } from '../hooks/useBinanceTicker';

export const PriceTicker: React.FC = () => {
    const { tickers, symbols } = useBinanceTicker();

    const formatPrice = (price: number) => {
        if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    };

    return (
        <div className="flex-1 overflow-hidden relative mx-4 hidden md:block group">
            <div className="flex animate-ticker hover:pause-ticker whitespace-nowrap gap-8 py-1 items-center">
                {/* Double the list for infinite scrolling effect */}
                {[...symbols, ...symbols].map((symbol, idx) => {
                    const data = tickers[symbol];
                    if (!data) return null;

                    return (
                        <div key={`${symbol}-${idx}`} className="flex items-center gap-2 min-w-fit">
                            <span className="text-[10px] font-black text-slate-500">{symbol.replace('USDT', '')}</span>
                            <span className={`text-xs font-mono font-bold transition-all duration-300 ${data.direction === 'up' ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' :
                                    data.direction === 'down' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' :
                                        'text-slate-300'
                                }`}>
                                ${formatPrice(data.price)}
                            </span>
                            <span className={`text-[9px] ${data.changePercent >= 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
