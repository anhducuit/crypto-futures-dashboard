import React, { useState, useRef } from 'react';
import { X, Download, Share2, BarChart3, Layers, TrendingUp, TrendingDown, Minus, Sparkles, Target } from 'lucide-react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { formatNumber } from '../utils/calculations';
import type { MAAnalysis } from '../hooks/useBinanceKlines';

interface AnalysisShareModalProps {
    type: 'VOLUME' | 'MA' | 'FIBONACCI';
    symbol: string;
    data: any; // Can be MAAnalysis or Fibonacci specific data
    onClose: () => void;
}

export const AnalysisShareModal: React.FC<AnalysisShareModalProps> = ({ type, symbol, data, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                style: { borderRadius: '0' }
            });
            download(dataUrl, `Analysis_${type}_${symbol}.png`);
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setGenerating(false);
        }
    };

    const renderVolumeContent = () => {
        const ma = data as MAAnalysis;
        return (
            <div className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-3">
                    {ma.timeframes.map((tf) => (
                        <div key={tf.timeframe} className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-white/50 uppercase">{tf.label}</span>
                                <span className={`text-[10px] font-bold ${tf.volumeRatio > 1.5 ? 'text-green-400' : 'text-white'}`}>
                                    {tf.volumeRatio.toFixed(2)}x
                                </span>
                            </div>
                            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${tf.volumeRatio > 1.5 ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min(tf.volumeRatio * 30, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-[8px] font-mono text-white/40">
                                <span>RSI: {tf.rsi.toFixed(1)}</span>
                                <span>GAP: {tf.priceGap.toFixed(2)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMAContent = () => {
        const ma = data as MAAnalysis;
        return (
            <div className="space-y-4 w-full">
                <div className="space-y-2">
                    {ma.timeframes.map((tf) => (
                        <div key={tf.timeframe} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                                {tf.trend === 'bullish' ? <TrendingUp size={14} className="text-green-500" /> : tf.trend === 'bearish' ? <TrendingDown size={14} className="text-red-500" /> : <Minus size={14} className="text-gray-500" />}
                                <span className="text-xs font-bold text-white">{tf.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase ${tf.trend === 'bullish' ? 'text-green-500' : tf.trend === 'bearish' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {tf.trend === 'bullish' ? 'Tăng' : tf.trend === 'bearish' ? 'Giảm' : 'Trung Lập'}
                                </span>
                                <span className="text-[10px] font-mono text-white/60">${formatNumber(tf.currentPrice, 2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={`p-4 rounded-xl border ${ma.overallBias === 'long' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Xu Hướng Tổng Quan</p>
                            <p className={`text-2xl font-black italic ${ma.overallBias === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                {ma.overallBias === 'long' ? 'STRONG LONG' : 'STRONG SHORT'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Độ Tin Cậy</p>
                            <p className="text-xl font-black text-[var(--color-golden)]">{ma.confidence.toFixed(0)}%</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFibContent = () => {
        const fib = data as {
            levels: Array<{ ratio: number; price: number; isGoldenZone: boolean }>;
            swingHigh: string;
            swingLow: string;
            direction: string;
            timeframe: string;
        };
        const goldenZone = fib.levels.filter(l => l.isGoldenZone);

        return (
            <div className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-center">
                        <p className="text-[8px] text-green-400 font-bold uppercase mb-0.5">Swing High</p>
                        <p className="text-xs font-black text-white">${formatNumber(parseFloat(fib.swingHigh), 2)}</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-center">
                        <p className="text-[8px] text-red-400 font-bold uppercase mb-0.5">Swing Low</p>
                        <p className="text-xs font-black text-white">${formatNumber(parseFloat(fib.swingLow), 2)}</p>
                    </div>
                </div>

                {goldenZone.length >= 2 && (
                    <div className="p-3 bg-[var(--color-golden)]/10 border border-[var(--color-golden)]/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-[var(--color-golden)]" />
                            <span className="text-[10px] font-black text-white uppercase italic">Golden Zone</span>
                        </div>
                        <span className="text-xs font-black text-[var(--color-golden)] italic">
                            ${formatNumber(Math.min(...goldenZone.map(l => l.price)), 2)} - ${formatNumber(Math.max(...goldenZone.map(l => l.price)), 2)}
                        </span>
                    </div>
                )}

                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-[10px]">
                        <thead className="bg-white/5 text-white/40 font-bold uppercase">
                            <tr>
                                <th className="px-3 py-2 text-left">Level</th>
                                <th className="px-3 py-2 text-right">Price ($)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {fib.levels.slice(0, 8).map((l) => (
                                <tr key={l.ratio} className={l.isGoldenZone ? 'bg-[var(--color-golden)]/5' : ''}>
                                    <td className="px-3 py-1.5 font-bold flex items-center gap-1.5">
                                        {l.isGoldenZone && <Target size={10} className="text-[var(--color-golden)]" />}
                                        <span className={l.isGoldenZone ? 'text-[var(--color-golden)]' : 'text-white/70'}>{l.ratio}</span>
                                    </td>
                                    <td className={`px-3 py-1.5 text-right font-mono font-bold ${l.isGoldenZone ? 'text-[var(--color-golden)]' : fib.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatNumber(l.price, 2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const getIcon = () => {
        switch (type) {
            case 'VOLUME': return <BarChart3 size={40} className="text-blue-400" />;
            case 'MA': return <TrendingUp size={40} className="text-green-400" />;
            case 'FIBONACCI': return <Layers size={40} className="text-[var(--color-golden)]" />;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'VOLUME': return 'PHÂN TÍCH KHỐI LƯỢNG';
            case 'MA': return 'PHÂN TÍCH MA ĐA KHUNG';
            case 'FIBONACCI': return 'FIBONACCI RETRACEMENT';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                        <Share2 size={18} className="text-[var(--color-golden)]" />
                        <span className="font-bold uppercase text-sm">CHIA SẺ PHÂN TÍCH</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Card Preview Area */}
                <div className="p-8 flex justify-center bg-[#050505]">
                    <div
                        ref={cardRef}
                        className="relative w-full max-w-[340px] aspect-[4/5] p-6 flex flex-col justify-between overflow-hidden border-4 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
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
                                    <p className="text-[8px] font-bold text-[var(--color-golden)] tracking-[0.2em] uppercase opacity-80 mt-1">Hệ Thống Phân Tích Pro</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-[14px] font-black italic text-white tracking-widest leading-none">{symbol}</span>
                                <span className="block text-[8px] font-bold text-white/40 mt-1 uppercase">Analysis Report</span>
                            </div>
                        </div>

                        {/* Middle Content Section */}
                        <div className="relative z-10 flex-1 flex flex-col items-center">
                            <div className="flex flex-col items-center mb-4">
                                <div className="mb-2 opacity-50">{getIcon()}</div>
                                <h2 className="text-sm font-black italic text-[var(--color-golden)] tracking-[0.1em]">{getTitle()}</h2>
                            </div>

                            {type === 'VOLUME' && renderVolumeContent()}
                            {type === 'MA' && renderMAContent()}
                            {type === 'FIBONACCI' && renderFibContent()}
                        </div>

                        {/* Footer Disclaimer */}
                        <div className="relative z-10 mt-6 text-center border-t border-white/5 pt-4">
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
