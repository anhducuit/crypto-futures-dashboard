import React, { useState, useRef } from 'react';
import { X, Download, Share2, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

interface CoinShareModalProps {
    symbol: string;
    winRate: number;
    wins: number;
    losses: number;
    total: number;
    tfBreakdown?: Record<string, { total: number, wins: number, losses: number }>;
    timeFilter: '24h' | '7d' | '30d' | 'all';
    onClose: () => void;
}

export const CoinShareModal: React.FC<CoinShareModalProps> = ({
    symbol,
    winRate,
    wins,
    losses,
    total,
    tfBreakdown,
    timeFilter,
    onClose
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    const coinName = symbol.replace('USDT', '');
    const filterText = timeFilter === 'all' ? 'Tất Cả' : timeFilter === '24h' ? '24 Giờ' : timeFilter === '7d' ? '7 Ngày' : '30 Ngày';
    const now = new Date();
    const timestamp = now.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                style: { borderRadius: '0' }
            });
            download(dataUrl, `${coinName}_Performance_${Date.now()}.png`);
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
                        <span className="font-bold uppercase text-sm">CHIA SẺ HIỆU SUẤT</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Card Preview Area */}
                <div className="p-8 flex justify-center bg-[#050505]">
                    <div
                        ref={cardRef}
                        className="relative w-full max-w-[340px] min-h-[500px] p-6 flex flex-col justify-between border-4 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                        style={{
                            background: '#0a0a0a',
                            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20, 20, 20, 1) 0%, rgba(5, 5, 5, 1) 100%)'
                        }}
                    >
                        {/* Background Patterns */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        <div className="absolute -bottom-10 -right-10 opacity-[0.05] pointer-events-none rotate-12 select-none">
                            <span className="text-[200px] font-black italic text-white leading-none">AĐ</span>
                        </div>

                        {/* Top Branding Section */}
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--color-golden)] to-yellow-900 shadow-lg border border-white/10">
                                    <span className="text-xl font-black italic text-black -tracking-widest">AĐ</span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-black italic tracking-tighter text-white leading-none">ANH DUC TRADER</h1>
                                    <p className="text-[8px] font-bold text-[var(--color-golden)] tracking-[0.2em] uppercase opacity-80 mt-1">Trading Performance</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-bold text-white/40 uppercase">{filterText}</span>
                            </div>
                        </div>

                        {/* Middle Content Section */}
                        <div className="relative z-10 flex-1 flex flex-col">
                            {/* Coin Symbol */}
                            <div className="text-center mb-6">
                                <div className="mb-2 opacity-50 flex justify-center">
                                    <PieChart size={40} className={winRate >= 50 ? 'text-green-400' : 'text-red-400'} />
                                </div>
                                <h2 className="text-4xl font-black italic text-white tracking-wider mb-2">{coinName}</h2>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">USDT Perpetual</p>
                            </div>

                            {/* Win Rate */}
                            <div className="text-center mb-6">
                                <div className={`text-5xl font-black ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {winRate.toFixed(1)}%
                                </div>
                                <div className="text-xs text-white/50 font-bold mt-2 uppercase tracking-wider">Win Rate</div>
                            </div>

                            {/* Win/Loss Boxes */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <TrendingUp size={12} className="text-green-400" />
                                        <span className="text-[10px] text-green-400 font-bold uppercase">Thắng</span>
                                    </div>
                                    <div className="text-2xl font-black text-green-400">{wins}</div>
                                </div>
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <TrendingDown size={12} className="text-red-400" />
                                        <span className="text-[10px] text-red-400 font-bold uppercase">Thua</span>
                                    </div>
                                    <div className="text-2xl font-black text-red-400">{losses}</div>
                                </div>
                            </div>

                            {/* Timeframe Breakdown */}
                            {tfBreakdown && Object.keys(tfBreakdown).length > 0 && (
                                <div className="bg-white/5 rounded-lg border border-white/5 p-3 mb-4">
                                    <div className="text-[10px] font-bold text-[var(--color-golden)] mb-2 uppercase tracking-wider">Phân tích theo khung:</div>
                                    <div className="space-y-1.5">
                                        {Object.entries(tfBreakdown)
                                            .filter(([_, data]) => data.total > 0)
                                            .map(([tf, data]) => {
                                                const rate = data.total > 0 ? (data.wins / data.total * 100) : 0;
                                                return (
                                                    <div key={tf} className="flex justify-between items-center text-[9px]">
                                                        <span className="text-white/60 font-bold">{tf}:</span>
                                                        <span className={`font-black ${rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {rate.toFixed(0)}% ({data.wins}/{data.losses})
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Total Signals */}
                            <div className="text-center">
                                <div className="text-[9px] text-white/40 uppercase tracking-wider">Tổng số tín hiệu</div>
                                <div className="text-xl font-black text-white">{total}</div>
                            </div>
                        </div>

                        {/* Footer Disclaimer */}
                        <div className="relative z-10 mt-6 text-center border-t border-white/5 pt-4">
                            <p className="text-[8px] text-white/40 font-medium mb-1">{timestamp}</p>
                            <p className="text-[7px] text-white/30 font-medium tracking-[0.1em]">© 2026 PHÂN TÍCH ĐỘC QUYỀN BỞI ANH DỨC TRADER • TỰ DO TÀI CHÍNH</p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-white/5 text-[var(--color-text-secondary)] rounded-xl font-bold transition-all text-sm">Đóng</button>
                    <button
                        onClick={handleDownload}
                        disabled={generating}
                        className="px-4 py-2 bg-gradient-to-r from-[var(--color-golden)] to-yellow-600 hover:scale-[1.02] active:scale-[0.98] text-black rounded-xl font-black transition-all text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                        {generating ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div> : <><Download size={16} />TẢI ẢNH (HD)</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
