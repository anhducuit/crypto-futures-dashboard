import React, { useState, useRef } from 'react';
import { X, Download, Share2, TrendingUp, TrendingDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { formatNumber } from '../utils/calculations';

interface PnLShareModalProps {
    trade: {
        symbol: string;
        signal: string;
        price_at_signal: number;
        status: 'SUCCESS' | 'FAILED';
        target_price?: number;
        stop_loss?: number;
        timeframe: string;
    };
    onClose: () => void;
}

export const PnLShareModal: React.FC<PnLShareModalProps> = ({ trade, onClose }) => {
    const [leverage, setLeverage] = useState(20);
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    const isWin = trade.status === 'SUCCESS';
    const exitPrice = isWin ? (trade.target_price || trade.price_at_signal) : (trade.stop_loss || trade.price_at_signal);

    // Calculate PnL % based on Price Difference * Leverage
    const priceDiff = trade.signal === 'LONG'
        ? (exitPrice - trade.price_at_signal) / trade.price_at_signal
        : (trade.price_at_signal - exitPrice) / trade.price_at_signal;

    const pnlPercentage = priceDiff * leverage * 100;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 3, // High quality
                style: {
                    borderRadius: '0'
                }
            });
            download(dataUrl, `PnL_${trade.symbol}_${trade.status}.png`);
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                        <Share2 size={18} className="text-[var(--color-golden)]" />
                        <span className="font-bold">CHIA SẺ LỢI NHUẬN</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Settings */}
                <div className="p-4 bg-black/20 flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">Điều chỉnh đòn bẩy:</span>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="1"
                            max="125"
                            value={leverage}
                            onChange={(e) => setLeverage(parseInt(e.target.value))}
                            className="accent-[var(--color-golden)]"
                        />
                        <span className="text-sm font-bold w-12 text-right">{leverage}x</span>
                    </div>
                </div>

                {/* PnL Card Preview Area */}
                <div className="p-6 flex justify-center bg-[#0a0a0a]">
                    <div
                        ref={cardRef}
                        className={`relative w-full max-w-[320px] aspect-[4/5] p-6 flex flex-col justify-between overflow-hidden border border-white/10 shadow-inner ${isWin ? 'bg-gradient-to-br from-[#0a1f0a] to-[#050505]' : 'bg-gradient-to-br from-[#1f0a0a] to-[#050505]'}`}
                        style={{ backgroundSize: 'cover' }}
                    >
                        {/* Background Overlay Decor */}
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            {isWin ? <TrendingUp size={120} /> : <TrendingDown size={120} />}
                        </div>

                        {/* Top Branding */}
                        <div className="relative z-10">
                            <h2 className="text-[10px] font-medium tracking-[0.2em] text-white/50 mb-0.5">PRO CRYPTO FUTURES</h2>
                            <h1 className="text-lg font-black tracking-tight text-[var(--color-golden)]">ANH DUC TRADER</h1>
                        </div>

                        {/* Middle Info */}
                        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${trade.signal === 'LONG' ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}>
                                    {trade.signal}
                                </span>
                                <span className="text-xl font-black text-white">{trade.symbol}</span>
                            </div>

                            <div className={`text-6xl font-black tracking-tighter my-2 ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
                            </div>

                            <div className={`text-xs font-bold px-4 py-1 rounded-full border ${isWin ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                {isWin ? '★ WINNER ★' : '★ LOSER ★'}
                            </div>
                        </div>

                        {/* Bottom Stats */}
                        <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase font-bold mb-0.5">Entry Price</p>
                                <p className="text-sm font-bold text-white">${formatNumber(trade.price_at_signal, trade.price_at_signal > 1 ? 2 : 4)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/40 uppercase font-bold mb-0.5">Exit Price</p>
                                <p className="text-sm font-bold text-white">${formatNumber(exitPrice, exitPrice > 1 ? 2 : 4)}</p>
                            </div>
                            <div className="col-span-2 flex justify-between items-center opacity-60">
                                <span className="text-[10px] font-mono">{trade.timeframe} Chart</span>
                                <span className="text-[10px] font-mono">{leverage}x Leverage</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 grid grid-cols-2 gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-white/5 text-[var(--color-text-secondary)] rounded-xl font-bold transition-all text-sm"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={generating}
                        className="px-4 py-2 bg-gradient-to-r from-[var(--color-golden)] to-yellow-600 hover:scale-[1.02] active:scale-[0.98] text-black rounded-xl font-black transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10"
                    >
                        {generating ? (
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Download size={16} />
                                TẢI ẢNH (HD)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
