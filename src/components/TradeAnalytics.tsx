import React, { useState } from 'react';
import { PieChart, TrendingUp, BarChart2, Share2 } from 'lucide-react';
import { CoinShareModal } from './CoinShareModal';
import { useTradeAnalytics } from '../hooks/useTradeAnalytics';

export const TradeAnalytics: React.FC = () => {
    const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all');
    const { stats, lastScan, botOnline, loading } = useTradeAnalytics(timeFilter);
    const [shareModalCoin, setShareModalCoin] = useState<any | null>(null);

    if (loading && stats.length === 0) {
        return (
            <div className="card p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--color-golden)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Time Filter & Header */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <BarChart2 className="text-[var(--color-golden)]" size={24} />
                    <h2 className="text-xl font-black tracking-tighter text-white">ANALYTICS</h2>
                </div>
                <div className="flex bg-[var(--color-bg-secondary)] p-1 rounded-xl border border-[var(--color-border)] shadow-inner">
                    {(['all', '24h', '7d', '30d'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setTimeFilter(f)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${timeFilter === f ? 'bg-[var(--color-golden)] text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            {f === 'all' ? 'TẤT CẢ' : f === '24h' ? '24H' : f === '7d' ? '7D' : '30D'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bot Status Bar */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${botOnline ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${botOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                        Bot: {botOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                    {lastScan ? new Date(lastScan).toLocaleTimeString('vi-VN') : 'N/A'}
                </div>
            </div>

            {/* Insight Performance Section */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-red-500/20 p-3 rounded-full text-red-500">
                        <TrendingUp size={20} className="rotate-180" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Coin Yếu Nhất</p>
                        <h4 className="text-lg font-black text-white">
                            {(() => {
                                const realStats = stats.slice(1).filter(s => s.total >= 5);
                                if (realStats.length === 0) return '---';
                                const worst = [...realStats].sort((a, b) => a.winRate - b.winRate)[0];
                                return worst ? `${worst.symbol} (${worst.winRate.toFixed(0)}%)` : '---';
                            })()}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 gap-4">
                {stats.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="card p-4 bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] border-l-4 border-l-[var(--color-golden)]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">{s.symbol}</p>
                                <h3 className="text-xl font-black mt-1 text-white">
                                    {s.winRate.toFixed(1)}% <span className="text-[10px] font-normal opacity-50 ml-1">Win Rate</span>
                                </h3>
                            </div>
                            <div className={`p-2 rounded-lg ${s.winRate >= 50 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                <PieChart size={18} />
                            </div>
                        </div>
                        <div className="mt-3 flex gap-4 text-[10px]">
                            <span className="text-green-400 font-bold">W: {s.wins}</span>
                            <span className="text-red-400 font-bold">L: {s.losses}</span>
                            <span className="text-slate-500 ml-auto">T: {s.total}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance by Coin - Table */}
            <div className="card overflow-hidden">
                <div className="card-header bg-[var(--color-bg-secondary)] p-3">
                    <span className="text-xs font-bold tracking-tight uppercase">THỐNG KÊ CHI TIẾT</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-black/20 text-[var(--color-text-secondary)] uppercase font-bold">
                            <tr>
                                <th className="px-3 py-2">Coin</th>
                                <th className="px-3 py-2">Lệnh</th>
                                <th className="px-3 py-2">Thắng</th>
                                <th className="px-3 py-2">Thua</th>
                                <th className="px-3 py-2">Tỷ lệ</th>
                                <th className="px-3 py-2 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {stats.slice(1, 10).map((s, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    <td className="px-3 py-2 font-bold text-white italic">{s.symbol}</td>
                                    <td className="px-3 py-2">{s.total}</td>
                                    <td className="px-3 py-2 text-green-400 font-bold">{s.wins}</td>
                                    <td className="px-3 py-2 text-red-400 font-bold">{s.losses}</td>
                                    <td className="px-3 py-2 font-mono">{s.winRate.toFixed(0)}%</td>
                                    <td className="px-3 py-2">
                                        <button onClick={() => setShareModalCoin(s)} className="p-1 hover:text-[var(--color-golden)]">
                                            <Share2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Share Modal */}
            {shareModalCoin && (
                <CoinShareModal
                    symbol={shareModalCoin.symbol}
                    winRate={shareModalCoin.winRate}
                    wins={shareModalCoin.wins}
                    losses={shareModalCoin.losses}
                    total={shareModalCoin.total}
                    tfBreakdown={shareModalCoin.tfBreakdown}
                    timeFilter={timeFilter}
                    onClose={() => setShareModalCoin(null)}
                />
            )}
        </div>
    );
};
