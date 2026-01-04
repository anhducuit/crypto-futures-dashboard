import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { formatNumber } from '../utils/calculations';

interface LivePriceDisplayProps {
    price: number | null;
    previousPrice: number | null;
    priceDirection: 'up' | 'down' | null;
    symbol: string;
    isConnected: boolean;
    error: string | null;
    onManualPrice: (price: number) => void;
}

export const LivePriceDisplay: React.FC<LivePriceDisplayProps> = ({
    price,
    previousPrice,
    priceDirection,
    symbol,
    isConnected,
    error,
    onManualPrice
}) => {
    const [flashClass, setFlashClass] = useState('');
    const [manualInput, setManualInput] = useState('');
    const priceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (priceDirection === 'up') {
            setFlashClass('flash-green');
        } else if (priceDirection === 'down') {
            setFlashClass('flash-red');
        }

        const timer = setTimeout(() => setFlashClass(''), 300);
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
        <div className="card">
            <div className="card-header">
                <Activity size={16} className="text-[var(--color-golden)]" />
                GIÁ REAL-TIME
            </div>

            <div className="text-center">
                <div className="text-sm text-[var(--color-text-secondary)] mb-2">
                    {symbol || 'Chưa chọn Symbol'}
                </div>

                {price !== null ? (
                    <div
                        ref={priceRef}
                        className={`text-4xl md:text-5xl font-bold mb-3 rounded-lg py-3 transition-colors ${flashClass} ${priceDirection === 'up'
                                ? 'text-green-500'
                                : priceDirection === 'down'
                                    ? 'text-red-500'
                                    : 'text-white'
                            }`}
                    >
                        ${formatNumber(price, getDecimals(price))}
                    </div>
                ) : (
                    <div className="text-4xl font-bold mb-3 text-[var(--color-text-secondary)]">
                        ---
                    </div>
                )}

                {price !== null && previousPrice !== null && (
                    <div className={`flex items-center justify-center gap-2 text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>
                            {priceChange >= 0 ? '+' : ''}{formatNumber(priceChange, getDecimals(price))}
                        </span>
                        <span className="text-[var(--color-text-secondary)]">|</span>
                        <span>
                            {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(4)}%
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 alert-warning">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm">{error}</p>
                        <form onSubmit={handleManualSubmit} className="mt-2 flex gap-2">
                            <input
                                type="number"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                placeholder="Nhập giá thủ công"
                                className="flex-1 py-2 px-3 text-sm"
                                step="any"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[var(--color-golden)] text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors"
                            >
                                Áp dụng
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
