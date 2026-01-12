import React, { useState, useEffect } from 'react';
import { Layers, Target, Sparkles, Clock, ChevronDown, RefreshCw } from 'lucide-react';
import { calculateFibonacciLevels, formatNumber } from '../utils/calculations';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface FibonacciCalculatorProps {
    direction: 'long' | 'short';
    maAnalysis: MAAnalysis | null;
    maLoading: boolean;
    onRefreshMA: () => void;
}

export const FibonacciCalculator: React.FC<FibonacciCalculatorProps> = ({
    direction,
    maAnalysis,
    maLoading,
    onRefreshMA
}) => {
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15m');
    const [swingHigh, setSwingHigh] = useState<string>('');
    const [swingLow, setSwingLow] = useState<string>('');
    const [levels, setLevels] = useState<Array<{ ratio: number; price: number; isGoldenZone: boolean }>>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Get selected timeframe data
    const selectedData = maAnalysis?.timeframes.find(tf => tf.timeframe === selectedTimeframe);

    // Auto-fill from selected timeframe
    useEffect(() => {
        if (selectedData) {
            setSwingHigh(selectedData.swingHigh.toString());
            setSwingLow(selectedData.swingLow.toString());
        }
    }, [selectedData, selectedTimeframe]);

    // Calculate Fibonacci levels
    useEffect(() => {
        const high = parseFloat(swingHigh);
        const low = parseFloat(swingLow);

        if (!isNaN(high) && !isNaN(low) && high > low) {
            const calculatedLevels = calculateFibonacciLevels(high, low, direction);
            setLevels(calculatedLevels);
        } else {
            setLevels([]);
        }
    }, [swingHigh, swingLow, direction]);

    const getDecimals = (price: number) => {
        if (price >= 1000) return 2;
        if (price >= 1) return 4;
        return 6;
    };

    const goldenZoneLevels = levels.filter(l => l.isGoldenZone);
    const goldenZoneRange = goldenZoneLevels.length >= 2
        ? `$${formatNumber(Math.min(...goldenZoneLevels.map(l => l.price)), 2)} - $${formatNumber(Math.max(...goldenZoneLevels.map(l => l.price)), 2)}`
        : '';

    const timeframeOptions = [
        { value: '1m', label: '1 Phút' },
        { value: '15m', label: '15 Phút' },
        { value: '1h', label: '1 Giờ' },
        { value: '4h', label: '4 Giờ' },
    ];

    const handleTimeframeChange = (tf: string) => {
        setSelectedTimeframe(tf);
        setIsDropdownOpen(false);
    };

    return (
        <div className="card">
            <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[var(--color-golden)]" />
                    FIBONACCI RETRACEMENT
                </div>
                <button
                    onClick={onRefreshMA}
                    disabled={maLoading}
                    className={`p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors ${maLoading ? 'animate-spin' : ''}`}
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw size={14} className="text-[var(--color-text-secondary)]" />
                </button>
            </div>

            <div className="space-y-4 min-h-[550px]">
                {/* Timeframe Selector */}
                <div>
                    <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-2">
                        <Clock size={14} />
                        Chọn Khung Thời Gian Phân Tích
                    </label>
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-golden)] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-[var(--color-golden)]" />
                                <span className="font-medium text-white">
                                    {timeframeOptions.find(t => t.value === selectedTimeframe)?.label}
                                </span>
                                {selectedData && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${selectedData.trend === 'bullish'
                                        ? 'bg-green-500/20 text-green-400'
                                        : selectedData.trend === 'bearish'
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {selectedData.trend === 'bullish' ? 'Tăng' : selectedData.trend === 'bearish' ? 'Giảm' : 'Trung lập'}
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={18} className={`text-[var(--color-text-secondary)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl z-20 overflow-hidden">
                                {timeframeOptions.map((tf) => {
                                    const tfData = maAnalysis?.timeframes.find(t => t.timeframe === tf.value);
                                    return (
                                        <button
                                            key={tf.value}
                                            onClick={() => handleTimeframeChange(tf.value)}
                                            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-bg-tertiary)] transition-colors ${selectedTimeframe === tf.value ? 'bg-[var(--color-golden)]/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`font-medium ${selectedTimeframe === tf.value ? 'text-[var(--color-golden)]' : 'text-white'}`}>
                                                    {tf.label}
                                                </span>
                                                {tfData && (
                                                    <span className={`text-xs px-2 py-0.5 rounded ${tfData.trend === 'bullish'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : tfData.trend === 'bearish'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        {tfData.trend === 'bullish' ? 'Tăng' : tfData.trend === 'bearish' ? 'Giảm' : 'Trung lập'}
                                                    </span>
                                                )}
                                            </div>
                                            {tfData && (
                                                <div className="text-xs text-[var(--color-text-secondary)]">
                                                    H: ${formatNumber(tfData.swingHigh, 0)} | L: ${formatNumber(tfData.swingLow, 0)}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Swing High/Low from Selected Timeframe */}
                {selectedData && (
                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text-secondary)]">Dữ liệu từ {timeframeOptions.find(t => t.value === selectedTimeframe)?.label}</span>
                            <span className={`font-medium ${selectedData.trend === 'bullish' ? 'text-green-400' : selectedData.trend === 'bearish' ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                MA20: ${formatNumber(selectedData.ma20, getDecimals(selectedData.ma20))}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 bg-[var(--color-bg-primary)] rounded">
                                <div className="text-xs text-green-400 mb-1">Swing High</div>
                                <div className="font-mono font-bold text-white">${formatNumber(selectedData.swingHigh, getDecimals(selectedData.swingHigh))}</div>
                            </div>
                            <div className="p-2 bg-[var(--color-bg-primary)] rounded">
                                <div className="text-xs text-red-400 mb-1">Swing Low</div>
                                <div className="font-mono font-bold text-white">${formatNumber(selectedData.swingLow, getDecimals(selectedData.swingLow))}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Override */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">
                            Swing High ($)
                        </label>
                        <input
                            type="number"
                            value={swingHigh}
                            onChange={(e) => setSwingHigh(e.target.value)}
                            placeholder="Giá cao nhất"
                            step="any"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">
                            Swing Low ($)
                        </label>
                        <input
                            type="number"
                            value={swingLow}
                            onChange={(e) => setSwingLow(e.target.value)}
                            placeholder="Giá thấp nhất"
                            step="any"
                        />
                    </div>
                </div>

                {/* Golden Zone */}
                {goldenZoneRange && (
                    <div className="golden-zone p-3 rounded-lg flex items-center gap-3">
                        <Sparkles size={20} className="text-[var(--color-golden)] flex-shrink-0" />
                        <div>
                            <div className="text-sm font-semibold text-[var(--color-golden)]">Golden Zone (0.559 - 0.667)</div>
                            <div className="text-lg font-bold text-white">{goldenZoneRange}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">Vùng Entry tốt nhất</div>
                        </div>
                    </div>
                )}

                {/* Fibonacci Levels */}
                {levels.length > 0 && (
                    <div className="space-y-1 mt-4">
                        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] px-3 pb-2 border-b border-[var(--color-border)]">
                            <span>Level</span>
                            <span>Giá ($)</span>
                        </div>

                        {levels.map((level) => (
                            <div
                                key={level.ratio}
                                className={`fib-level ${level.isGoldenZone ? 'golden-zone' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    {level.isGoldenZone && (
                                        <Target size={14} className="text-[var(--color-golden)]" />
                                    )}
                                    <span className={level.isGoldenZone ? 'text-[var(--color-golden)] font-semibold' : 'text-[var(--color-text-secondary)]'}>
                                        {level.ratio}
                                    </span>
                                </div>
                                <span className={`font-medium ${level.isGoldenZone
                                    ? 'text-[var(--color-golden)]'
                                    : direction === 'long'
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                    }`}>
                                    ${formatNumber(level.price, getDecimals(level.price))}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {(levels.length === 0 || maLoading) && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-[var(--color-text-secondary)] opacity-50">
                        {maLoading ? (
                            <div className="animate-spin w-8 h-8 border-4 border-[var(--color-golden)] border-t-transparent rounded-full mb-4"></div>
                        ) : (
                            <Layers size={48} className="mb-3" />
                        )}
                        <p className="text-sm font-medium">
                            {maLoading ? 'Đang phân tích dữ liệu...' : 'Chưa có dữ liệu cho symbol/khung giờ này'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
