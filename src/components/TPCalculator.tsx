import React, { useState, useEffect } from 'react';
import { Target, DollarSign, Gauge, TrendingUp, TrendingDown, Banknote, PiggyBank, Info } from 'lucide-react';
import { formatNumber, formatCurrency } from '../utils/calculations';

interface TPCalculatorProps {
    currentPrice: number | null;
    direction: 'long' | 'short';
}

/**
 * Calculate TP targets for FUTURES trading
 * 
 * For Futures with leverage:
 * - ROI = (Price Change % × Leverage)
 * - To get 100% ROI (double your margin):
 *   - Long: TP = Entry × (1 + 1/Leverage)
 *   - Short: TP = Entry × (1 - 1/Leverage)
 */
function calculateFuturesTP(
    entryPrice: number,
    leverage: number,
    direction: 'long' | 'short'
): { tp1: number; tp2: number; priceChange1: number; priceChange2: number } {
    // TP1: 100% ROI means doubling the margin
    // Price change needed = 100% / Leverage = 1/Leverage
    const priceChange1 = 1 / leverage;

    // TP2: After taking out principal at TP1, need another 100% on remaining
    // From TP1 position, need same price change again
    const priceChange2 = 2 / leverage; // Total move from entry for TP2

    let tp1: number;
    let tp2: number;

    if (direction === 'long') {
        tp1 = entryPrice * (1 + priceChange1);
        tp2 = entryPrice * (1 + priceChange2);
    } else {
        tp1 = entryPrice * (1 - priceChange1);
        tp2 = entryPrice * (1 - priceChange2);
    }

    return {
        tp1,
        tp2,
        priceChange1: priceChange1 * 100,
        priceChange2: priceChange2 * 100
    };
}

export const TPCalculator: React.FC<TPCalculatorProps> = ({
    currentPrice,
    direction
}) => {
    const [entryPrice, setEntryPrice] = useState<string>('');
    const [leverage, setLeverage] = useState<number>(10);

    // Auto-fill entry price when current price changes
    useEffect(() => {
        if (currentPrice) {
            setEntryPrice(currentPrice.toString());
        }
    }, [currentPrice]);

    const entry = parseFloat(entryPrice) || 0;
    const targets = entry > 0 ? calculateFuturesTP(entry, leverage, direction) : null;

    const getDecimals = (price: number) => {
        if (price >= 1000) return 2;
        if (price >= 1) return 4;
        return 6;
    };

    return (
        <div className="card">
            <div className="card-header">
                <Target size={16} className="text-[var(--color-golden)]" />
                PROFIT TAKING SIMULATOR (FUTURES)
            </div>

            <div className="space-y-4">
                {/* Info Box */}
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                    <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-blue-300">
                        <span className="font-semibold">Công thức Futures:</span> ROI = Biến động giá × Leverage.
                        Với {leverage}x, giá cần di chuyển {formatNumber(100 / leverage, 2)}% để đạt 100% ROI.
                    </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-1.5">
                            <DollarSign size={14} />
                            Giá Vào Lệnh ($)
                        </label>
                        <input
                            type="number"
                            value={entryPrice}
                            onChange={(e) => setEntryPrice(e.target.value)}
                            placeholder="Entry Price"
                            step="any"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-1.5">
                            <Gauge size={14} />
                            Đòn Bẩy
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="5"
                                max="20"
                                step="1"
                                value={leverage}
                                onChange={(e) => setLeverage(parseInt(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-[var(--color-golden)] font-bold w-12 text-right">{leverage}x</span>
                        </div>
                    </div>
                </div>

                {/* Direction Indicator */}
                <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg ${direction === 'long'
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                    {direction === 'long' ? (
                        <TrendingUp size={18} className="text-green-500" />
                    ) : (
                        <TrendingDown size={18} className="text-red-500" />
                    )}
                    <span className={`font-semibold ${direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                        {direction === 'long' ? 'LONG - Giá cần TĂNG' : 'SHORT - Giá cần GIẢM'}
                    </span>
                </div>

                {/* TP Targets */}
                {targets && (
                    <div className="space-y-3 pt-4">
                        {/* Target 1: Withdraw Principal */}
                        <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/30">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <Banknote size={24} className="text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-[var(--color-text-secondary)]">Target 1 - 100% ROI</div>
                                        <div className="text-xl font-bold text-green-400">
                                            ${formatNumber(targets.tp1, getDecimals(targets.tp1))}
                                        </div>
                                        <div className="text-xs text-green-400/80 mt-1">
                                            {direction === 'long' ? '+' : '-'}{formatNumber(targets.priceChange1, 2)}% từ Entry
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="px-3 py-1.5 bg-green-500/20 rounded-lg">
                                        <div className="text-xs text-green-400 font-medium">RÚT VỐN GỐC</div>
                                        <div className="text-sm font-bold text-white">x2 Margin</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-green-500/10 rounded text-sm text-green-300">
                                💡 Tại mức giá này với {leverage}x leverage, bạn sẽ có 100% ROI. Rút vốn gốc để bảo toàn.
                            </div>
                        </div>

                        {/* Target 2: Take 50% Profit */}
                        <div className="p-4 rounded-lg bg-gradient-to-r from-[var(--color-golden)]/10 to-[var(--color-golden)]/5 border border-[var(--color-golden)]/30">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[var(--color-golden)]/20 rounded-lg">
                                        <PiggyBank size={24} className="text-[var(--color-golden)]" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-[var(--color-text-secondary)]">Target 2 - 200% ROI</div>
                                        <div className="text-xl font-bold text-[var(--color-golden)]">
                                            ${formatNumber(targets.tp2, getDecimals(targets.tp2))}
                                        </div>
                                        <div className="text-xs text-[var(--color-golden)]/80 mt-1">
                                            {direction === 'long' ? '+' : '-'}{formatNumber(targets.priceChange2, 2)}% từ Entry
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="px-3 py-1.5 bg-[var(--color-golden)]/20 rounded-lg">
                                        <div className="text-xs text-[var(--color-golden)] font-medium">CHỐT LỢI NHUẬN</div>
                                        <div className="text-sm font-bold text-white">x3 Margin</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-[var(--color-golden)]/10 rounded text-sm text-yellow-300">
                                💡 Sau khi rút vốn gốc ở TP1, chốt 50% lợi nhuận còn lại tại mức này. Let it ride phần còn lại.
                            </div>
                        </div>

                        {/* Visual Progress */}
                        <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                            <div className="flex items-center justify-between text-sm mb-3">
                                <span className="text-[var(--color-text-secondary)]">Lộ Trình Take Profit ({leverage}x)</span>
                            </div>

                            <div className="relative h-4 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
                                {/* Entry Point */}
                                <div className="absolute left-[5%] top-0 bottom-0 w-0.5 bg-white z-10"></div>

                                {/* Progress to TP1 */}
                                <div
                                    className="absolute left-[5%] top-0 bottom-0 bg-gradient-to-r from-green-600 to-green-400 rounded-l-full"
                                    style={{ width: '45%' }}
                                ></div>

                                {/* TP1 Marker */}
                                <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-green-400 z-10"></div>

                                {/* Progress to TP2 */}
                                <div
                                    className="absolute left-[50%] top-0 bottom-0 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-r-full"
                                    style={{ width: '45%' }}
                                ></div>

                                {/* TP2 Marker */}
                                <div className="absolute right-[5%] top-0 bottom-0 w-0.5 bg-[var(--color-golden)] z-10"></div>
                            </div>

                            <div className="flex justify-between mt-2 text-xs">
                                <span className="text-white">Entry: ${formatNumber(entry, 0)}</span>
                                <span className="text-green-400">TP1: +100% ROI</span>
                                <span className="text-[var(--color-golden)]">TP2: +200% ROI</span>
                            </div>

                            {/* Price movement needed */}
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-[var(--color-bg-primary)] rounded">
                                    <span className="text-[var(--color-text-secondary)]">Giá cần di chuyển TP1: </span>
                                    <span className={direction === 'long' ? 'text-green-400' : 'text-red-400'}>
                                        {direction === 'long' ? '+' : '-'}${formatNumber(Math.abs(targets.tp1 - entry), getDecimals(entry))}
                                    </span>
                                </div>
                                <div className="p-2 bg-[var(--color-bg-primary)] rounded">
                                    <span className="text-[var(--color-text-secondary)]">Giá cần di chuyển TP2: </span>
                                    <span className={direction === 'long' ? 'text-green-400' : 'text-red-400'}>
                                        {direction === 'long' ? '+' : '-'}${formatNumber(Math.abs(targets.tp2 - entry), getDecimals(entry))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!targets && (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                        <Target size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nhập giá Entry để tính các mức Take Profit</p>
                    </div>
                )}
            </div>
        </div>
    );
};
