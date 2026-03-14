import React from 'react';
import { Clock, TrendingUp, TrendingDown, Info, BarChart2, Menu, AlertTriangle } from 'lucide-react';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface AnalysisGlobalControlsProps {
    symbol: string;
    onSymbolChange: (symbol: string) => void;
    activeTimeframe: string;
    onTimeframeChange: (tf: string) => void;
    direction: 'long' | 'short';
    onDirectionChange: (dir: 'long' | 'short') => void;
    maAnalysis: MAAnalysis | null;
}

export const AnalysisGlobalControls: React.FC<AnalysisGlobalControlsProps> = ({
    symbol,
    onSymbolChange,
    activeTimeframe,
    onTimeframeChange,
    direction,
    onDirectionChange,
    maAnalysis
}) => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'XAUUSDT', 'XAGUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'NEARUSDT', 'TIAUSDT'];
    const timeframes = [
        { id: '1', label: '1m' },
        { id: '15', label: '15m' },
        { id: '60', label: '1h' },
        { id: '240', label: '4h' }
    ];

    return (
        <div className="card !p-0 overflow-hidden border border-[var(--color-golden)]/30 shadow-lg shadow-[var(--color-golden)]/5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                {/* Symbol Selector Section */}
                <div className="flex items-center gap-3 px-5 py-3 border-r border-[var(--color-border)] bg-[var(--color-golden)]/5 group relative">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-golden)]/10 flex items-center justify-center border border-[var(--color-golden)]/20">
                        <BarChart2 size={16} className="text-[var(--color-golden)]" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider leading-none mb-1 cursor-pointer">Chọn Coin</label>
                        <select 
                            value={symbol}
                            onChange={(e) => onSymbolChange(e.target.value)}
                            className="bg-transparent text-lg font-black text-white hover:text-[var(--color-golden)] transition-colors outline-none cursor-pointer appearance-none pr-6"
                        >
                            {symbols.map(s => (
                                <option key={s} value={s} className="bg-[var(--color-bg-secondary)] text-white font-sans text-sm">
                                    {s.replace('USDT', '')}
                                </option>
                            ))}
                        </select>
                        {/* Custom Dropdown Arrow */}
                        <div className="absolute right-4 bottom-4 pointer-events-none text-[var(--color-golden)] opacity-50 group-hover:opacity-100 transition-opacity">
                            <Menu size={10} className="rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Main Controls Wrapper */}
                <div className="flex-1 flex flex-col md:flex-row items-center">
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 px-6 py-3">
                        {/* Timeframe Selector Group */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                <Clock size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Khung:</span>
                            </div>
                            <div className="flex p-0.5 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)] w-full sm:w-auto">
                                {timeframes.map((tf) => (
                                    <button
                                        key={tf.id}
                                        onClick={() => onTimeframeChange(tf.id)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex-1 sm:flex-none ${
                                            activeTimeframe === tf.id
                                                ? 'bg-[var(--color-golden)] text-black shadow-inner shadow-black/10'
                                                : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="hidden sm:block w-px h-6 bg-[var(--color-border)] opacity-50 mx-2"></div>

                        {/* Direction Selector Group */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                <TrendingUp size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Hướng:</span>
                            </div>
                            <div className="flex p-0.5 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)] w-full sm:w-auto">
                                <button
                                    onClick={() => onDirectionChange('long')}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all flex-1 sm:flex-none ${
                                        direction === 'long'
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                                            : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <TrendingUp size={14} />
                                    LONG
                                </button>
                                <button
                                    onClick={() => onDirectionChange('short')}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all flex-1 sm:flex-none ${
                                        direction === 'short'
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                            : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <TrendingDown size={14} />
                                    SHORT
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Conflict Warning Banner - Moved to the right */}
                    {maAnalysis && maAnalysis.overallBias !== 'neutral' && maAnalysis.overallBias !== direction && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/20 border-l border-[var(--color-border)] animate-pulse lg:min-w-[300px]">
                            <AlertTriangle size={14} className="text-red-500 animate-bounce" />
                            <div className="text-[10px] sm:text-xs whitespace-nowrap">
                                <span className="font-bold text-red-400 uppercase">Cảnh Báo Xung Đột: </span>
                                <span className="text-white opacity-90">
                                    Robot báo <b className="text-red-400 uppercase">{maAnalysis.overallBias}</b>!
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dashboard Tip */}
                <div className="hidden lg:flex items-center gap-2 px-6 py-3 bg-blue-500/5 text-blue-400 text-[10px] italic border-l border-[var(--color-border)] max-w-sm">
                    <Info size={12} className="flex-shrink-0" />
                    <span>Thay đổi tại đây sẽ đồng bộ toàn bộ các bảng phân tích bên dưới.</span>
                </div>
            </div>
        </div>
    );
};
