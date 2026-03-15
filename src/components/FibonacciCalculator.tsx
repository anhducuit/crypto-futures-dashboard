import React, { useState, useEffect } from 'react';
import { Layers, Target, Sparkles, Clock, ChevronDown, RefreshCw, Share2 } from 'lucide-react';
import { calculateFibonacciLevels, formatNumber } from '../utils/calculations';
import type { MAAnalysis } from '../hooks/useBinanceKlines';
import { AnalysisShareModal } from './AnalysisShareModal';

interface FibonacciCalculatorProps {
    symbol: string;
    direction: 'long' | 'short';
    maAnalysis: MAAnalysis | null;
    maLoading: boolean;
    onRefreshMA: () => void;
}

export const FibonacciCalculator: React.FC<FibonacciCalculatorProps> = ({
    symbol,
    direction,
    maAnalysis,
    maLoading,
    onRefreshMA
}) => {
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15');
    const [swingHigh, setSwingHigh] = useState<string>('');
    const [swingLow, setSwingLow] = useState<string>('');
    const [levels, setLevels] = useState<Array<{ ratio: number; price: number; isGoldenZone: boolean }>>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
        { value: '1', label: 'M1_INTRA' },
        { value: '15', label: 'M15_TF' },
        { value: '60', label: 'H1_EXEC' },
        { value: '240', label: 'H4_ANCHOR' },
    ];

    const handleTimeframeChange = (tf: string) => {
        setSelectedTimeframe(tf);
        setIsDropdownOpen(false);
    };

    return (
        <div className="card flare-border reveal shadow-2xl shadow-black/40">
            <div className="card-header border-b border-[var(--color-border)] pb-4 mb-8 justify-between">
                <div className="flex items-center gap-3">
                    <Layers size={14} className="text-[var(--color-flare)]" />
                    <span className="font-black tracking-[0.2em] uppercase">Fibonacci sequence [EXT]</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        disabled={levels.length === 0}
                        className="p-2 text-[var(--color-silver)] hover:text-[var(--color-flare)] transition-all duration-300 disabled:opacity-10"
                        title="Broadcast Projections"
                    >
                        <Share2 size={16} />
                    </button>
                    <button
                        onClick={onRefreshMA}
                        disabled={maLoading}
                        className={`p-2 text-[var(--color-silver)] hover:text-white transition-all duration-300 ${maLoading ? 'animate-spin' : ''}`}
                        title="Force Recalc"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Timeframe Selector */}
                <div>
                    <label className="flex items-center gap-2 text-[9px] font-black text-[var(--color-silver)] uppercase tracking-[0.2em] mb-4 opacity-40 italic">
                        <Clock size={12} />
                        Active Vector Source
                    </label>
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-[1px] hover:border-[var(--color-flare)]/40 transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4">
                                <Clock size={16} className="text-[var(--color-flare)] opacity-50 group-hover:opacity-100 transition-opacity" />
                                <span className="font-black tracking-widest text-white text-xs">
                                    {timeframeOptions.find(t => t.value === selectedTimeframe)?.label}
                                </span>
                                {selectedData && (
                                    <span className={`text-[8px] font-black italic tracking-widest px-2 py-0.5 border border-current bg-white/5 ${selectedData.trend === 'bullish'
                                        ? 'text-[var(--color-long)]'
                                        : selectedData.trend === 'bearish'
                                            ? 'text-[var(--color-short)]'
                                            : 'text-[var(--color-silver)]'
                                        }`}>
                                        {selectedData.trend === 'bullish' ? 'BULL' : selectedData.trend === 'bearish' ? 'BEAR' : 'SIDE'}
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={14} className={`text-[var(--color-silver)] transition-transform duration-500 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-flare)]/20 rounded-[1px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden reveal">
                                {timeframeOptions.map((tf) => {
                                    const tfData = maAnalysis?.timeframes.find(t => t.timeframe === tf.value);
                                    return (
                                        <button
                                            key={tf.value}
                                            onClick={() => handleTimeframeChange(tf.value)}
                                            className={`w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-flare)]/5 transition-colors border-b border-[var(--color-border)] last:border-0 ${selectedTimeframe === tf.value ? 'bg-[var(--color-flare)]/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`text-[10px] font-black tracking-widest ${selectedTimeframe === tf.value ? 'text-[var(--color-flare)]' : 'text-white'}`}>
                                                    {tf.label}
                                                </span>
                                                {tfData && (
                                                    <span className={`text-[8px] font-black italic px-2 py-0.5 border border-current ${tfData.trend === 'bullish'
                                                        ? 'text-[var(--color-long)] border-[var(--color-long)]/30'
                                                        : tfData.trend === 'bearish'
                                                            ? 'text-[var(--color-short)] border-[var(--color-short)]/30'
                                                            : 'text-[var(--color-silver)] border-[var(--color-silver)]/30'
                                                        }`}>
                                                        {tfData.trend === 'bullish' ? 'BULL' : tfData.trend === 'bearish' ? 'BEAR' : 'SIDE'}
                                                    </span>
                                                )}
                                            </div>
                                            {tfData && (
                                                <div className="text-[9px] font-mono text-[var(--color-silver)] opacity-40">
                                                    H:${formatNumber(tfData.swingHigh, 0)} | L:${formatNumber(tfData.swingLow, 0)}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Manual Override Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                        <label className="block text-[8px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] mb-2 opacity-40 group-focus-within:opacity-100 transition-opacity italic">
                            Reference High [H]
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={swingHigh}
                                onChange={(e) => setSwingHigh(e.target.value)}
                                placeholder="0.00"
                                step="any"
                                className="w-full bg-black/40 border border-[var(--color-border)] border-l-[3px] border-l-[var(--color-long)] rounded-[1px] px-4 py-3 text-xs text-white font-mono focus:border-[var(--color-flare)] focus:bg-black/60 transition-all outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--color-silver)] opacity-20">$</div>
                        </div>
                    </div>
                    <div className="relative group">
                        <label className="block text-[8px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] mb-2 opacity-40 group-focus-within:opacity-100 transition-opacity italic">
                            Reference Low [L]
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={swingLow}
                                onChange={(e) => setSwingLow(e.target.value)}
                                placeholder="0.00"
                                step="any"
                                className="w-full bg-black/40 border border-[var(--color-border)] border-l-[3px] border-l-[var(--color-short)] rounded-[1px] px-4 py-3 text-xs text-white font-mono focus:border-[var(--color-flare)] focus:bg-black/60 transition-all outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--color-silver)] opacity-20">$</div>
                        </div>
                    </div>
                </div>

                {/* Main Analysis Architecture */}
                <div className="grid grid-cols-1 pt-4">
                    <div className={`col-start-1 row-start-1 space-y-6 transition-all duration-700 ${maLoading ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-4'}`}>
                        <div className="h-[120px] bg-white/5 flare-border animate-pulse"></div>
                        <div className="h-[90px] bg-white/5 flare-border animate-pulse"></div>
                        <div className="space-y-2">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-[40px] bg-white/5 rounded-[1px] opacity-10"></div>
                            ))}
                        </div>
                    </div>

                    <div className={`col-start-1 row-start-1 space-y-6 transition-all duration-700 ${!maLoading ? 'opacity-100 translate-y-0' : 'opacity-0 scale-95'}`}>
                        {selectedData && (
                            <div className="p-5 bg-[var(--color-bg-tertiary)] rounded-[1px] border-l-[4px] border-l-[var(--color-flare)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                                    <Sparkles size={40} className="text-[var(--color-flare)]" />
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[8px] font-black text-[var(--color-silver)] tracking-[0.3em] uppercase opacity-40 italic">Vector Intelligence Input</span>
                                    <span className={`text-[9px] font-black px-3 py-1 bg-white/5 italic tracking-tighter ${selectedData.trend === 'bullish' ? 'text-[var(--color-long)] border border-[var(--color-long)]/20' : 'text-[var(--color-short)] border border-[var(--color-short)]/20'}`}>
                                        BASIS_MA20: ${formatNumber(selectedData.ma20, getDecimals(selectedData.ma20))}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-6 relative">
                                    <div className="bg-black/20 p-3 border border-[var(--color-border)] border-r-0">
                                        <div className="text-[8px] text-[var(--color-long)] font-black mb-2 tracking-[0.2em] uppercase">Structural High</div>
                                        <div className="font-mono font-black text-white text-base tracking-tighter">${formatNumber(selectedData.swingHigh, getDecimals(selectedData.swingHigh))}</div>
                                    </div>
                                    <div className="bg-black/20 p-3 border border-[var(--color-border)] ">
                                        <div className="text-[8px] text-[var(--color-short)] font-black mb-2 tracking-[0.2em] uppercase">Structural Low</div>
                                        <div className="font-mono font-black text-white text-base tracking-tighter">${formatNumber(selectedData.swingLow, getDecimals(selectedData.swingLow))}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {goldenZoneRange && (
                            <div className="p-6 bg-[var(--color-bg-tertiary)] border-[1px] border-[var(--color-flare)]/30 rounded-[1px] flex items-center gap-6 relative overflow-hidden group shadow-[0_0_30px_rgba(255,77,0,0.1)]">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-flare)]"></div>
                                <div className="p-4 bg-[var(--color-flare)] shadow-[0_0_20px_var(--color-flare)] shrink-0">
                                    <Sparkles size={24} className="text-black" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-[var(--color-flare)] uppercase tracking-[0.4em] mb-2 italic anim-flare">The Golden Zone [0.618 - 0.5]</div>
                                    <div className="text-2xl font-black text-white tracking-tighter font-mono">{goldenZoneRange}</div>
                                    <div className="text-[9px] text-[var(--color-silver)] font-black tracking-[0.2em] uppercase opacity-40 mt-2">Optimal Execution Territory</div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 mt-4">
                            {levels.length > 0 ? (
                                <>
                                    <div className="flex justify-between text-[8px] font-black text-[var(--color-silver)] tracking-[0.4em] px-4 pb-4 border-b border-[var(--color-border)] opacity-30 italic">
                                        <span>VECTOR_RATIO</span>
                                        <span>PROJECTION_VALUE</span>
                                    </div>
                                    <div className="space-y-[2px]">
                                        {levels.map((level, idx) => (
                                            <div
                                                key={level.ratio}
                                                className={`flex items-center justify-between px-5 py-3 rounded-[1px] transition-all duration-500 reveal ${level.isGoldenZone 
                                                    ? 'bg-[var(--color-flare)]/10 border-x border-x-[var(--color-flare)]/40 shadow-[inset_0_0_20px_rgba(255,77,0,0.05)]' 
                                                    : 'bg-[var(--color-bg-tertiary)]/30 hover:bg-white/5 border border-transparent'}`}
                                                style={{ animationDelay: `${idx * 0.05}s` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {level.isGoldenZone && (
                                                        <Target size={14} className="text-[var(--color-flare)] animate-pulse" />
                                                    )}
                                                    <span className={`text-[11px] font-black tracking-widest ${level.isGoldenZone ? 'text-[var(--color-flare)]' : 'text-[var(--color-silver)] opacity-60'}`}>
                                                        {level.ratio.toFixed(3)}
                                                    </span>
                                                </div>
                                                <span className={`font-mono font-black text-sm tracking-tighter ${level.isGoldenZone
                                                    ? 'text-[var(--color-flare)] text-base'
                                                    : direction === 'long'
                                                        ? 'text-[var(--color-long)]'
                                                        : 'text-[var(--color-short)]'
                                                    }`}>
                                                    ${formatNumber(level.price, getDecimals(level.price))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-10 grayscale">
                                    <Layers size={60} className="mb-6 stroke-[1px]" />
                                    <p className="text-[10px] font-black tracking-[0.4em] uppercase">No Dynamic Sequence Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isShareModalOpen && (
                <AnalysisShareModal
                    type="FIBONACCI"
                    symbol={symbol}
                    data={{
                        levels,
                        swingHigh,
                        swingLow,
                        direction,
                        timeframe: selectedTimeframe
                    }}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
        </div>
    );
};
