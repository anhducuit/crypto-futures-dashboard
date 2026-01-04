import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, Wallet, DollarSign, Gauge, Shield, Zap } from 'lucide-react';
import {
    calculatePositionSize,
    calculateLiquidationPrice,
    calculateStoplossPnL,
    calculateSplitEntries,
    formatNumber,
    formatCurrency
} from '../utils/calculations';

interface PositionCalculatorProps {
    currentPrice: number | null;
    direction: 'long' | 'short';
    swingLow?: number;
}

type CalculatorMode = 'stoploss' | 'no-stoploss';

export const PositionCalculator: React.FC<PositionCalculatorProps> = ({
    currentPrice,
    direction,
    swingLow = 0
}) => {
    const [walletBalance, setWalletBalance] = useState<string>('1000');
    const [entryPrice, setEntryPrice] = useState<string>('');
    const [stoplossPrice, setStoplossPrice] = useState<string>('');
    const [leverage, setLeverage] = useState<number>(10);
    const [mode, setMode] = useState<CalculatorMode>('stoploss');
    const [riskPercentage, setRiskPercentage] = useState<number>(10);

    // Auto-fill entry price when current price changes
    useEffect(() => {
        if (currentPrice) {
            setEntryPrice(currentPrice.toString());
        }
    }, [currentPrice]);

    const wallet = parseFloat(walletBalance) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const stoploss = parseFloat(stoplossPrice) || 0;

    // Calculate position size
    const positionData = calculatePositionSize(wallet, entry, leverage, riskPercentage);

    // Calculate liquidation price
    const liquidationPrice = entry > 0 ? calculateLiquidationPrice(entry, leverage, direction) : 0;

    // Calculate stoploss PnL
    const stoplossPnL = mode === 'stoploss' && stoploss > 0
        ? calculateStoplossPnL(entry, stoploss, positionData.positionSize, leverage, direction)
        : 0;

    // Calculate split entries for no-stoploss mode
    const splitEntries = mode === 'no-stoploss' && entry > 0
        ? calculateSplitEntries(wallet, entry, swingLow || entry * 0.9)
        : null;

    return (
        <div className="card">
            <div className="card-header">
                <Calculator size={16} className="text-[var(--color-golden)]" />
                POSITION SIZING & STRATEGY
            </div>

            <div className="space-y-4">
                {/* Mode Selection */}
                <div className="flex gap-2 p-1 bg-[var(--color-bg-tertiary)] rounded-lg">
                    <button
                        onClick={() => setMode('stoploss')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'stoploss'
                            ? 'bg-[var(--color-golden)] text-black'
                            : 'text-[var(--color-text-secondary)] hover:text-white'
                            }`}
                    >
                        <Shield size={16} />
                        Stoploss Mode
                    </button>
                    <button
                        onClick={() => setMode('no-stoploss')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'no-stoploss'
                            ? 'bg-red-500 text-white'
                            : 'text-[var(--color-text-secondary)] hover:text-white'
                            }`}
                    >
                        <Zap size={16} />
                        No-Stoploss Mode
                    </button>
                </div>

                {/* Warning for No-Stoploss Mode */}
                {mode === 'no-stoploss' && (
                    <div className="alert-warning">
                        <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Rủi ro cao! Cảnh báo Liquidation</p>
                            <p className="text-sm opacity-80">Vị thế của bạn có thể bị thanh lý nếu giá chạm mức Liquidation</p>
                        </div>
                    </div>
                )}

                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-1.5">
                            <Wallet size={14} />
                            Số Dư Ví ($)
                        </label>
                        <input
                            type="number"
                            value={walletBalance}
                            onChange={(e) => setWalletBalance(e.target.value)}
                            placeholder="1000"
                            step="any"
                        />
                    </div>
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
                </div>

                {mode === 'stoploss' && (
                    <div>
                        <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-1.5">
                            <Shield size={14} />
                            Giá Stoploss ($)
                        </label>
                        <input
                            type="number"
                            value={stoplossPrice}
                            onChange={(e) => setStoplossPrice(e.target.value)}
                            placeholder="Stoploss Price"
                            step="any"
                        />
                    </div>
                )}

                {/* Leverage Slider */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                            <Gauge size={14} />
                            Đòn Bẩy
                        </label>
                        <span className="text-[var(--color-golden)] font-bold text-lg">{leverage}x</span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="20"
                        step="1"
                        value={leverage}
                        onChange={(e) => setLeverage(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-1">
                        <span>5x</span>
                        <span>10x</span>
                        <span>15x</span>
                        <span>20x</span>
                    </div>
                </div>

                {/* Risk Percentage Slider */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-[var(--color-text-secondary)]">
                            % Vốn Rủi Ro
                        </label>
                        <span className="text-[var(--color-golden)] font-bold">{riskPercentage}%</span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="20"
                        step="1"
                        value={riskPercentage}
                        onChange={(e) => setRiskPercentage(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-1">
                        <span>5%</span>
                        <span>10%</span>
                        <span>15%</span>
                        <span>20%</span>
                    </div>
                </div>

                {/* Results */}
                {entry > 0 && (
                    <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                        <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase">Kết Quả Tính Toán</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                <div className="text-xs text-[var(--color-text-secondary)]">Vốn Sử Dụng</div>
                                <div className="text-lg font-bold text-white">{formatCurrency(positionData.positionSize)}</div>
                            </div>
                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                <div className="text-xs text-[var(--color-text-secondary)]">Giá Trị Vị Thế</div>
                                <div className="text-lg font-bold text-[var(--color-golden)]">{formatCurrency(positionData.positionValue)}</div>
                            </div>
                        </div>

                        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                            <div className="text-xs text-[var(--color-text-secondary)]">Số Lượng</div>
                            <div className="text-lg font-bold text-white">{formatNumber(positionData.quantity, 6)}</div>
                        </div>

                        {mode === 'stoploss' && stoploss > 0 && (
                            <div className={`p-3 rounded-lg ${stoplossPnL < 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                                <div className="text-xs text-[var(--color-text-secondary)]">PnL Ước Tính tại Stoploss</div>
                                <div className={`text-lg font-bold ${stoplossPnL < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {stoplossPnL >= 0 ? '+' : ''}{formatCurrency(stoplossPnL)}
                                </div>
                            </div>
                        )}

                        {/* Liquidation Price */}
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="flex items-center gap-1.5 text-xs text-red-400">
                                <AlertTriangle size={12} />
                                Giá Thanh Lý (Liquidation)
                            </div>
                            <div className="text-lg font-bold text-red-400">{formatCurrency(liquidationPrice)}</div>
                        </div>

                        {/* Split Entries for No-Stoploss Mode */}
                        {mode === 'no-stoploss' && splitEntries && (
                            <div className="space-y-2">
                                <h5 className="text-sm font-medium text-[var(--color-text-secondary)]">Gợi Ý Chia Entry</h5>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border-l-3 border-green-500">
                                        <div className="text-xs text-[var(--color-text-secondary)]">Entry 1 (5% Ví)</div>
                                        <div className="text-sm font-bold text-white">{formatCurrency(splitEntries.entry1.amount)}</div>
                                        <div className="text-xs text-green-400">@ {formatCurrency(splitEntries.entry1.price)}</div>
                                    </div>
                                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border-l-3 border-[var(--color-golden)]">
                                        <div className="text-xs text-[var(--color-text-secondary)]">Entry 2 (15% Ví)</div>
                                        <div className="text-sm font-bold text-white">{formatCurrency(splitEntries.entry2.amount)}</div>
                                        <div className="text-xs text-[var(--color-golden)]">@ {formatCurrency(splitEntries.entry2.price)}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
