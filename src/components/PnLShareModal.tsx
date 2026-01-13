import React, { useState, useRef } from 'react';
import { X, Download, Share2 } from 'lucide-react';
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
                <div className="p-8 flex justify-center bg-[#050505]">
                    <div
                        ref={cardRef}
                        className={`relative w-full max-w-[340px] aspect-[4/5] p-6 flex flex-col justify-between overflow-hidden border-4 ${isWin ? 'border-green-500/30' : 'border-red-500/30'} shadow-[0_0_40px_rgba(0,0,0,0.5)]`}
                        style={{
                            background: '#0a0a0a',
                            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20, 20, 20, 1) 0%, rgba(5, 5, 5, 1) 100%)'
                        }}
                    >
                        {/* Background Patterns - Grid & Stylized "AĐ" Watermark */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        <div className="absolute -bottom-10 -right-10 opacity-[0.05] pointer-events-none rotate-12 select-none">
                            <span className="text-[200px] font-black italic text-white leading-none">AĐ</span>
                        </div>

                        {/* Top Branding Section - Stylized "AĐ" Logo */}
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--color-golden)] to-yellow-900 shadow-lg shadow-yellow-500/20 border border-white/10">
                                <span className="text-2xl font-black italic text-black -tracking-widest">AĐ</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-black italic tracking-tighter text-white leading-none">ANH DUC TRADER</h1>
                                <p className="text-[9px] font-bold text-[var(--color-golden)] tracking-[0.3em] uppercase opacity-80 mt-1">Hệ Thống Phân Tích Pro</p>
                            </div>
                        </div>

                        {/* Middle Section - PnL Focus */}
                        <div className="relative z-10 py-6 flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded italic shadow-sm ${trade.signal === 'LONG' ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}>
                                    {trade.signal}
                                </span>
                                <span className="text-2xl font-black text-white italic tracking-tighter">{trade.symbol}</span>
                            </div>

                            <div className="relative pt-2">
                                {/* Adjusted ROE Position to prevent overlap */}
                                <div className={`absolute -right-8 -top-2 text-xs font-black italic ${isWin ? 'text-green-400/40' : 'text-red-400/40'}`}>
                                    ROE %
                                </div>
                                <div className={`text-7xl font-black tracking-tighter italic ${isWin ? 'text-green-400' : 'text-red-400'} drop-shadow-[0_0_15px_rgba(0,255,0,0.2)]`}>
                                    {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
                                </div>
                            </div>

                            <div className="mt-2 flex items-center gap-1.5">
                                <div className={`h-[1px] w-8 ${isWin ? 'bg-green-500/50' : 'bg-red-500/50'}`}></div>
                                <span className={`text-[12px] font-black tracking-[0.3em] italic ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                    {isWin ? 'WIN' : 'LOSS'}
                                </span>
                                <div className={`h-[1px] w-8 ${isWin ? 'bg-green-500/50' : 'bg-red-500/50'}`}></div>
                            </div>
                        </div>

                        {/* Bottom Stats - Glassmorphism Card */}
                        <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl overflow-hidden">
                            {/* Decorative line */}
                            <div className={`absolute top-0 left-0 w-full h-[2px] ${isWin ? 'bg-green-500/50' : 'bg-red-500/50'}`}></div>

                            <div className="grid grid-cols-2 gap-y-3">
                                <div>
                                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Giá Vào Lệnh</p>
                                    <p className="text-sm font-black text-white font-mono">${formatNumber(trade.price_at_signal, trade.price_at_signal > 1 ? 2 : 4)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Giá Hiện Tại</p>
                                    <p className="text-sm font-black text-white font-mono">${formatNumber(exitPrice, exitPrice > 1 ? 2 : 4)}</p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-golden)] animate-pulse"></div>
                                        <span className="text-[9px] font-black text-white/60 tracking-wider uppercase">CHIẾN THUẬT {trade.timeframe}</span>
                                    </div>
                                    <span className="text-[10px] font-black italic bg-[var(--color-golden)] text-black px-2 py-0.5 rounded shadow-sm">ĐÒN BẨY {leverage}X</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Disclaimer */}
                        <div className="mt-4 text-center">
                            <p className="text-[7px] text-white/20 font-medium tracking-[0.1em]">© 2026 PHÂN TÍCH ĐỘC QUYỀN BỞI ANH DỨC TRADER • TỰ DO TÀI CHÍNH</p>
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
