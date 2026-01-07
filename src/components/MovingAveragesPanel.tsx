import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, RefreshCw, Target } from 'lucide-react';
import { formatNumber } from '../utils/calculations';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface MovingAveragesPanelProps {
    data: MAAnalysis | null;
    loading: boolean;
    onRefresh: () => void;
    onSelectSwing: (swingHigh: number, swingLow: number, timeframe: string) => void;
}

export const MovingAveragesPanel: React.FC<MovingAveragesPanelProps> = ({
    data,
    loading,
    onRefresh,
    onSelectSwing
}) => {
    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'bullish':
                return <TrendingUp size={16} className="text-green-500" />;
            case 'bearish':
                return <TrendingDown size={16} className="text-red-500" />;
            default:
                return <Minus size={16} className="text-[var(--color-text-secondary)]" />;
        }
    };

    const getTrendLabel = (trend: string) => {
        switch (trend) {
            case 'bullish': return 'Tăng';
            case 'bearish': return 'Giảm';
            default: return 'Trung lập';
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'bullish': return 'text-green-500';
            case 'bearish': return 'text-red-500';
            default: return 'text-[var(--color-text-secondary)]';
        }
    };

    const getDecimals = (price: number) => {
        if (price >= 1000) return 2;
        if (price >= 1) return 4;
        return 6;
    };

    return (
        <div className="card">
            <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-[var(--color-golden)]" />
                    PHÂN TÍCH MA ĐA KHUNG
                </div>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className={`p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors ${loading ? 'animate-spin' : ''}`}
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw size={14} className="text-[var(--color-text-secondary)]" />
                </button>
            </div>

            {loading && !data && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-[var(--color-golden)] border-t-transparent rounded-full"></div>
                </div>
            )}

            {data && (
                <div className="space-y-3">
                    {/* Timeframe Analysis */}
                    {data.timeframes.map((tf) => (
                        <div
                            key={tf.timeframe}
                            className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getTrendIcon(tf.trend)}
                                    <span className="font-medium">{tf.label}</span>
                                </div>
                                <span className={`text-sm font-semibold ${getTrendColor(tf.trend)}`}>
                                    {getTrendLabel(tf.trend)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {tf.timeframe === '4h' ? (
                                    <>
                                        <div>
                                            <span className="text-[var(--color-text-secondary)]">MA50: </span>
                                            <span className="text-white font-mono">${formatNumber(tf.ma50 || 0, getDecimals(tf.ma50 || 0))}</span>
                                        </div>
                                        <div>
                                            <span className="text-[var(--color-text-secondary)]">MA200: </span>
                                            <span className="text-white font-mono">${formatNumber(tf.ma200 || 0, getDecimals(tf.ma200 || 0))}</span>
                                        </div>
                                    </>
                                ) : tf.timeframe === '1h' ? (
                                    <>
                                        <div>
                                            <span className="text-[var(--color-text-secondary)]">MA20: </span>
                                            <span className="text-white font-mono">${formatNumber(tf.ma20, getDecimals(tf.ma20))}</span>
                                        </div>
                                        <div>
                                            <span className="text-[var(--color-text-secondary)]">MA50: </span>
                                            <span className="text-white font-mono">${formatNumber(tf.ma50 || 0, getDecimals(tf.ma50 || 0))}</span>
                                        </div>
                                    </>
                                ) : tf.timeframe === '15m' ? (
                                    <>
                                        <div>
                                            <span className="text-[var(--color-text-secondary)]">MA12: </span>
                                            <span className="text-white font-mono">${formatNumber(tf.ma12 || 0, getDecimals(tf.ma12 || 0))}</span>
                                        </div>
                                        <div>
                                            <span className="text-[var(--color-text-secondary)]">MA26: </span>
                                            <span className="text-white font-mono">${formatNumber(tf.ma26 || 0, getDecimals(tf.ma26 || 0))}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <span className="text-[var(--color-text-secondary)]">MA20: </span>
                                            <span className="text-white font-mono">${formatNumber(tf.ma20, getDecimals(tf.ma20))}</span>
                                        </div>
                                        <div>
                                            <span className="text-[var(--color-text-secondary)]">Giá: </span>
                                            <span className={`font-mono ${tf.currentPrice > tf.ma20 ? 'text-green-400' : 'text-red-400'}`}>
                                                ${formatNumber(tf.currentPrice, getDecimals(tf.currentPrice))}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {tf.timeframe === '15m' && tf.cross && tf.cross !== 'none' && (
                                <div className={`text-xs font-bold text-center py-1 rounded ${tf.cross === 'bullish_cross' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {tf.cross === 'bullish_cross' ? 'GOLDEN CROSS (MA12 > MA26)' : 'DEATH CROSS (MA12 < MA26)'}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                                <div className="text-xs">
                                    <span className="text-green-400">H: ${formatNumber(tf.swingHigh, getDecimals(tf.swingHigh))}</span>
                                    <span className="text-[var(--color-text-secondary)] mx-2">|</span>
                                    <span className="text-red-400">L: ${formatNumber(tf.swingLow, getDecimals(tf.swingLow))}</span>
                                </div>
                                <button
                                    onClick={() => onSelectSwing(tf.swingHigh, tf.swingLow, tf.label)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--color-golden)]/20 text-[var(--color-golden)] rounded hover:bg-[var(--color-golden)]/30 transition-colors"
                                >
                                    <Target size={12} />
                                    Dùng
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Overall Recommendation */}
                    <div className={`p-4 rounded-lg border ${data.overallBias === 'long'
                        ? 'bg-green-500/10 border-green-500/30'
                        : data.overallBias === 'short'
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)]'
                        }`}>
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
                            Đề Xuất Từ MA
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {data.overallBias === 'long' ? (
                                    <TrendingUp size={24} className="text-green-500" />
                                ) : data.overallBias === 'short' ? (
                                    <TrendingDown size={24} className="text-red-500" />
                                ) : (
                                    <Minus size={24} className="text-[var(--color-text-secondary)]" />
                                )}
                                <span className={`text-xl font-bold ${data.overallBias === 'long'
                                    ? 'text-green-500'
                                    : data.overallBias === 'short'
                                        ? 'text-red-500'
                                        : 'text-[var(--color-text-secondary)]'
                                    }`}>
                                    {data.overallBias === 'long' ? 'LONG' : data.overallBias === 'short' ? 'SHORT' : 'CHỜ'}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-[var(--color-text-secondary)]">Độ tin cậy</div>
                                <div className="text-lg font-bold text-[var(--color-golden)]">
                                    {formatNumber(data.confidence, 0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!data && !loading && (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                    <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nhập symbol để xem phân tích MA</p>
                </div>
            )}
        </div>
    );
};
