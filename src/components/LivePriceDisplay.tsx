import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { formatNumber } from '../utils/calculations';
import { useTranslation, type Language } from '../utils/translations';

interface LivePriceDisplayProps {
    price: number | null;
    previousPrice: number | null;
    priceDirection: 'up' | 'down' | null;
    symbol: string;
    error: string | null;
    onManualPrice: (price: number) => void;
    language: Language;
}

export const LivePriceDisplay: React.FC<LivePriceDisplayProps> = ({
    price,
    previousPrice,
    priceDirection,
    symbol,
    error,
    onManualPrice,
    language
}) => {
    const t = useTranslation(language);
    const [flashClass, setFlashClass] = useState('');
    const [manualInput, setManualInput] = useState('');
    const priceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (priceDirection === 'up') {
            setFlashClass('flash-green');
        } else if (priceDirection === 'down') {
            setFlashClass('flash-red');
        }

        const timer = setTimeout(() => setFlashClass(''), 400);
        return () => clearTimeout(timer);
    }, [price, priceDirection]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = parseFloat(manualInput);
        if (!isNaN(numPrice) && numPrice > 0) {
            onManualPrice(numPrice);
            setManualInput('');
        }
    };

    const getDecimals = (p: number) => {
        if (p >= 1000) return 2;
        if (p >= 1) return 4;
        return 6;
    };

    const priceChange = price && previousPrice ? price - previousPrice : 0;
    const priceChangePercent = price && previousPrice ? ((price - previousPrice) / previousPrice) * 100 : 0;

    return (
        <div className="card flare-border reveal">
            <div className="card-header border-b border-[var(--color-border)] pb-2 mb-2">
                <Activity size={14} className="text-[var(--color-flare)]" />
                <span className="font-black tracking-[0.2em] uppercase">{t('real_time_telemetry')}</span>
            </div>

            <div className="text-center px-4">
                <div className="text-[10px] font-black text-[var(--color-silver)] uppercase tracking-[0.4em] mb-1 opacity-40">
                    {symbol || 'WAITING_FOR_DATA'}
                </div>

                {price !== null ? (
                    <div
                        ref={priceRef}
                        className={`text-3xl lg:text-4xl font-black tracking-tighter italic mb-1 py-1 transition-all duration-300 ${flashClass} ${priceDirection === 'up'
                            ? 'text-[var(--color-long)] drop-shadow-[0_0_15px_rgba(0,255,163,0.2)]'
                            : priceDirection === 'down'
                                ? 'text-[var(--color-short)] drop-shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                                : 'text-white'
                            }`}
                    >
                        <span className="opacity-30 text-xl mr-1">$</span>
                        {formatNumber(price, getDecimals(price))}
                    </div>
                ) : (
                    <div className="text-3xl lg:text-4xl font-black mb-1 text-[var(--color-bg-tertiary)] italic">
                        OFFLINE
                    </div>
                )}

                {price !== null && previousPrice !== null && (
                    <div className={`flex items-center justify-center gap-2 py-1.5 px-3 bg-[var(--color-bg-tertiary)] rounded-[1px] border border-[var(--color-border)] text-xs font-black tracking-widest ${priceChange >= 0 ? 'text-[var(--color-long)]' : 'text-[var(--color-short)]'
                        }`}>
                        <div className="flex items-center gap-1.5">
                            {priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{priceChange >= 0 ? '+' : ''}{formatNumber(priceChange, getDecimals(price))}</span>
                        </div>
                        <div className="w-[1px] h-3 bg-[var(--color-border)]"></div>
                        <span>{priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(4)}%</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2 text-[var(--color-short)] mb-4">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('feed_overridden')}</span>
                    </div>
                    <form onSubmit={handleManualSubmit} className="space-y-3">
                        <input
                            type="number"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder={t('manual_override')}
                            className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[2px] w-full py-2.5 px-4 text-xs font-mono text-white outline-none focus:border-[var(--color-flare)] placeholder:opacity-20"
                            step="any"
                        />
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[10px] font-black text-[var(--color-flare)] hover:bg-[var(--color-flare)] hover:text-black transition-all uppercase tracking-widest"
                        >
                            {t('sync_manual')}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
