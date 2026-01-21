import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, Clock, BarChart2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
    symbol: string;
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    tfBreakdown?: Record<string, { total: number, wins: number, losses: number }>;
}


export const TradeAnalytics: React.FC = () => {
    const [stats, setStats] = useState<AnalyticsData[]>([]);
    const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all');
    const [bestHours, setBestHours] = useState<Record<string, { wins: number, losses: number }>>({});
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [botOnline, setBotOnline] = useState<boolean>(true);

    const fetchData = async () => {
        try {
            const now = new Date();
            let query = supabase
                .from('trading_history')
                .select('id, created_at, symbol, signal, status, pnl_reason, strategy_name, timeframe')
                .order('created_at', { ascending: false });

            // Fetch Heartbeat
            const { data: heartbeat } = await supabase.from('bot_settings').select('value').eq('key', 'last_scan_at').single();
            if (heartbeat) {
                setLastScan(heartbeat.value);
                const diff = (new Date().getTime() - new Date(heartbeat.value).getTime()) / 1000;
                setBotOnline(diff < 300); // Online if scanned in last 5 mins
            }

            if (timeFilter !== 'all') {
                let dateLimit = new Date();
                if (timeFilter === '24h') dateLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                if (timeFilter === '7d') dateLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (timeFilter === '30d') dateLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                query = query.gte('created_at', dateLimit.toISOString());
            }

            let { data, error } = await query.limit(500);

            // FALLBACK if columns are missing
            if (error && error.message.includes('column') && error.message.includes('not exist')) {
                const fallbackQuery = supabase
                    .from('trading_history')
                    .select('id, created_at, symbol, signal, status, timeframe')
                    .order('created_at', { ascending: false });

                const { data: fbData, error: fbError } = await fallbackQuery.limit(500);
                data = fbData as any;
                error = fbError;
            }

            if (error) throw error;

            if (data) {

                // Calculate Stats
                const symbolMap: Record<string, { wins: number, losses: number, tfMap: any }> = {
                    'BTCUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'ETHUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'SOLUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'BNBUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'XRPUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'ADAUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'DOGEUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'LINKUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'AVAXUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'NEARUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'FTMUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'OPUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'ARBUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'TIAUSDT': { wins: 0, losses: 0, tfMap: {} },
                    'INJUSDT': { wins: 0, losses: 0, tfMap: {} }
                };
                let totalWin = 0, totalLoss = 0;

                data.forEach(t => {
                    const sym = t.symbol;
                    if (!symbolMap[sym]) symbolMap[sym] = { wins: 0, losses: 0, tfMap: {} };

                    const tf = t.timeframe || 'Unknown';
                    if (!symbolMap[sym].tfMap[tf]) symbolMap[sym].tfMap[tf] = { total: 0, wins: 0, losses: 0 };

                    if (t.status === 'SUCCESS') {
                        symbolMap[sym].wins++;
                        symbolMap[sym].tfMap[tf].wins++;
                        totalWin++;
                    } else if (t.status === 'FAILED') {
                        symbolMap[sym].losses++;
                        symbolMap[sym].tfMap[tf].losses++;
                        totalLoss++;
                    }
                    if (t.status !== 'PENDING') {
                        symbolMap[sym].tfMap[tf].total++;
                    }
                });

                // Calculate Session Stats (Morning, Afternoon, Evening, Night)
                const hourMap: Record<string, { wins: number, losses: number }> = {
                    'SÁNG (06-12h)': { wins: 0, losses: 0 },
                    'CHIỀU (12-18h)': { wins: 0, losses: 0 },
                    'TỐI (18-24h)': { wins: 0, losses: 0 },
                    'ĐÊM (00-06h)': { wins: 0, losses: 0 }
                };

                data.forEach(t => {
                    const hour = new Date(t.created_at).getHours();
                    let session = '';
                    if (hour >= 6 && hour < 12) session = 'SÁNG (06-12h)';
                    else if (hour >= 12 && hour < 18) session = 'CHIỀU (12-18h)';
                    else if (hour >= 18 && hour < 24) session = 'TỐI (18-24h)';
                    else session = 'ĐÊM (00-06h)';

                    if (t.status === 'SUCCESS') hourMap[session].wins++;
                    else if (t.status === 'FAILED') hourMap[session].losses++;
                });
                setBestHours(hourMap);

                const calculatedStats: AnalyticsData[] = Object.entries(symbolMap).map(([symbol, counts]) => ({
                    symbol,
                    wins: counts.wins,
                    losses: counts.losses,
                    total: counts.wins + counts.losses,
                    winRate: counts.wins + counts.losses > 0 ? (counts.wins / (counts.wins + counts.losses)) * 100 : 0,
                    tfBreakdown: counts.tfMap
                })).sort((a, b) => b.total - a.total);

                const global = {
                    symbol: 'TẤT CẢ (ALL)',
                    wins: totalWin,
                    losses: totalLoss,
                    total: totalWin + totalLoss,
                    winRate: (totalWin + totalLoss) > 0 ? (totalWin / (totalWin + totalLoss)) * 100 : 0
                };

                setStats([global, ...calculatedStats]);
            }
        } catch (e) {
            console.error('Error fetching analytics:', e);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeFilter]);


    return (
        <div className="space-y-6">
            {/* Time Filter & Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <BarChart2 className="text-[var(--color-golden)]" size={24} />
                    <h2 className="text-xl font-black tracking-tighter text-white">TRADING ANALYTICS</h2>
                </div>
                <div className="flex bg-[var(--color-bg-secondary)] p-1 rounded-xl border border-[var(--color-border)] shadow-inner">
                    {(['all', '24h', '7d', '30d'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setTimeFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeFilter === f ? 'bg-[var(--color-golden)] text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            {f === 'all' ? 'TẤT CẢ' : f === '24h' ? '24 GIỜ' : f === '7d' ? '7 NGÀY' : '30 NGÀY'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bot Status Bar */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${botOnline ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${botOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">
                        Trạng thái Bot Server: {botOnline ? 'ONLINE (ĐANG QUÉT)' : 'OFFLINE (CẦN KIỂM TRA)'}
                    </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                    Last Scan: {lastScan ? new Date(lastScan).toLocaleTimeString('vi-VN') : 'N/A'}
                </div>
            </div>

            {/* Insight Performance Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-red-500/20 p-3 rounded-full text-red-500">
                        <TrendingUp size={20} className="rotate-180" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Coin Yếu Nhất (Loss)</p>
                        <h4 className="text-lg font-black text-white">
                            {(() => {
                                const realStats = stats.slice(1).filter(s => s.total >= 5);
                                if (realStats.length === 0) return 'CHƯA ĐỦ DỮ LIỆU';
                                const worst = [...realStats].sort((a, b) => a.winRate - b.winRate)[0];
                                return `${worst.symbol} (${worst.winRate.toFixed(0)}%)`;
                            })()}
                        </h4>
                    </div>
                </div>
                <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-green-500/20 p-3 rounded-full text-green-500">
                        <BarChart2 size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Khung Giờ Vàng (Win Rate)</p>
                        <h4 className="text-lg font-black text-white">
                            {(() => {
                                const sessions = Object.entries(bestHours).map(([name, counts]) => ({
                                    name,
                                    rate: (counts.wins + counts.losses) > 0 ? (counts.wins / (counts.wins + counts.losses) * 100) : 0,
                                    total: counts.wins + counts.losses
                                })).filter(s => s.total >= 3);
                                if (sessions.length === 0) return 'CHƯA ĐỦ DỮ LIỆU';
                                const best = sessions.sort((a, b) => b.rate - a.rate)[0];
                                return `${best.name.split(' ')[0]} (${best.rate.toFixed(0)}%)`;
                            })()}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Header / Global Summary - Horizontal Scroll */}
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                {stats.map((s, idx) => (
                    <div key={idx} className="min-w-[280px] flex-shrink-0 card p-4 bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] border-l-4 border-l-[var(--color-golden)] hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">{s.symbol}</p>
                                <h3 className="text-2xl font-black mt-1 text-white">
                                    {s.winRate.toFixed(1)}%
                                    <span className="text-[10px] font-normal opacity-50 ml-1">Win Rate</span>
                                </h3>
                            </div>
                            <div className={`p-2 rounded-lg ${s.winRate >= 50 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                <PieChart size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-4 text-xs">
                            <span className="text-green-400 font-bold">W: {s.wins}</span>
                            <span className="text-red-400 font-bold">L: {s.losses}</span>
                            <span className="text-slate-500 ml-auto">Tổng: {s.total}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance by Coin - Table */}
            <div className="card overflow-hidden">
                <div className="card-header flex justify-between items-center bg-[var(--color-bg-secondary)] p-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-[var(--color-golden)]" />
                        <span className="font-bold tracking-tight">HIỆU SUẤT THEO COIN</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-[var(--color-text-secondary)] uppercase text-[10px] font-bold">
                            <tr>
                                <th className="px-4 py-3">Cặp Coin</th>
                                <th className="px-4 py-3">Tổng Lệnh</th>
                                <th className="px-4 py-3">Thắng</th>
                                <th className="px-4 py-3">Thua</th>
                                <th className="px-4 py-3">Tỷ lệ Thắng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {stats.slice(1).map((s, idx) => (
                                <React.Fragment key={idx}>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-bold text-white italic">{s.symbol}</td>
                                        <td className="px-4 py-3">{s.total}</td>
                                        <td className="px-4 py-3 text-green-400 font-bold">{s.wins}</td>
                                        <td className="px-4 py-3 text-red-400 font-bold">{s.losses}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full animate-grow-x ${s.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{ width: `${s.winRate}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-xs">{s.winRate.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Timeframe breakdown row */}
                                    {s.tfBreakdown && (
                                        <tr className="bg-black/10">
                                            <td colSpan={5} className="px-4 py-2">
                                                <div className="flex flex-wrap gap-4 text-[10px]">
                                                    {Object.entries(s.tfBreakdown).map(([tf, counts]) => (
                                                        <div key={tf} className="flex gap-2 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                            <span className="text-[var(--color-golden)] font-bold">{tf}:</span>
                                                            <span className="text-green-400">W: {counts.wins}</span>
                                                            <span className="text-red-400">L: {counts.losses}</span>
                                                            <span className="opacity-50">({counts.total > 0 ? (counts.wins / counts.total * 100).toFixed(0) : 0}%)</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Market Session Analysis - NEW TABLE */}
            <div className="card">
                <div className="card-header flex justify-between items-center bg-[var(--color-bg-secondary)] p-4">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[var(--color-golden)]" />
                        <span className="font-bold tracking-tight uppercase">PHÂN TÍCH GIỜ VÀNG (SÁNG/TRƯA/CHIỀU/TỐI)</span>
                    </div>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(bestHours).map(([session, counts]) => {
                        const total = counts.wins + counts.losses;
                        const rate = total > 0 ? (counts.wins / total * 100) : 0;
                        return (
                            <div key={session} className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                                <p className="text-[10px] text-slate-500 font-bold mb-1">{session}</p>
                                <p className={`text-lg font-black ${rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{rate.toFixed(0)}%</p>
                                <div className="mt-2 text-[10px] flex justify-center gap-2">
                                    <span className="text-green-500">W:{counts.wins}</span>
                                    <span className="text-red-500">L:{counts.losses}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="px-4 pb-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-[10px] text-blue-300 italic">
                            💡 Gợi ý: Dựa vào bảng này để biết Robot hoạt động hiệu quả nhất vào khung giờ nào để tối ưu lợi nhuận.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
