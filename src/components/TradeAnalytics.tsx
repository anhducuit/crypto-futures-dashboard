import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, Edit3, Save, CheckCircle2, XCircle, Filter, Clock, BarChart2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
    symbol: string;
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    tfBreakdown?: Record<string, { total: number, wins: number, losses: number }>;
}

interface TradeRecord {
    id: string;
    created_at: string;
    symbol: string;
    signal: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    pnl_reason: string | null;
    strategy_name: string | null;
    timeframe: string;
}

export const TradeAnalytics: React.FC = () => {
    const [stats, setStats] = useState<AnalyticsData[]>([]);
    const [recentTrades, setRecentTrades] = useState<TradeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all');

    const fetchData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            let query = supabase
                .from('trading_history')
                .select('id, created_at, symbol, signal, status, pnl_reason, strategy_name, timeframe')
                .order('created_at', { ascending: false });

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
                setRecentTrades(data);

                // Calculate Stats
                const symbolMap: Record<string, { wins: number, losses: number, tfMap: any }> = {};
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeFilter]);

    const handleSaveReason = async (id: string) => {
        try {
            const { error } = await supabase
                .from('trading_history')
                .update({ pnl_reason: editValue })
                .eq('id', id);

            if (error) throw error;
            setEditingId(null);
            fetchData();
        } catch (e) {
            alert('Lỗi khi lưu lý do');
        }
    };

    const filteredTrades = recentTrades.filter(t =>
        t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.strategy_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                                        className={`h-full rounded-full ${s.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
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

            {/* Detail Logs & Reasons */}
            <div className="card">
                <div className="card-header flex justify-between items-center p-4">
                    <div className="flex items-center gap-2">
                        <Edit3 size={16} className="text-[var(--color-golden)]" />
                        <span className="font-bold tracking-tight">BÁO CÁO CHI TIẾT & LÝ DO</span>
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Tìm coin hoặc chiến lược..."
                            className="bg-black/30 border border-[var(--color-border)] rounded-full pl-9 pr-4 py-1 text-xs focus:outline-none focus:border-[var(--color-golden)]/50 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="divide-y divide-[var(--color-border)] max-h-[600px] overflow-y-auto">
                    {filteredTrades.map(t => (
                        <div key={t.id} className="p-4 hover:bg-white/5 group">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className={`mt-1 p-1.5 rounded-lg ${t.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : t.status === 'FAILED' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {t.status === 'SUCCESS' ? <CheckCircle2 size={16} /> : t.status === 'FAILED' ? <XCircle size={16} /> : <Clock size={16} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white uppercase">{t.symbol}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.signal === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {t.signal}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                {new Date(t.created_at).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{t.strategy_name || 'Chiến lược mặc định'}</p>
                                    </div>
                                </div>

                                {editingId === t.id ? (
                                    <button
                                        onClick={() => handleSaveReason(t.id)}
                                        className="flex items-center gap-1.5 bg-[var(--color-golden)] text-black px-3 py-1 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-colors"
                                    >
                                        <Save size={14} /> LƯU
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setEditingId(t.id);
                                            setEditValue(t.pnl_reason || '');
                                        }}
                                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-white/10 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-white/20 transition-all border border-white/10"
                                    >
                                        <Edit3 size={14} /> SỬA LÝ DO
                                    </button>
                                )}
                            </div>

                            <div className="mt-3">
                                {editingId === t.id ? (
                                    <textarea
                                        className="w-full bg-black/40 border border-[var(--color-golden)]/30 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[var(--color-golden)] min-h-[80px]"
                                        placeholder="Nhập lý do thắng hoặc thua tại đây..."
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <p className={`text-sm ${t.pnl_reason ? 'text-slate-300 italic' : 'text-slate-600 italic'}`}>
                                            {t.pnl_reason || 'Chưa có ghi chú lý do...'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredTrades.length === 0 && !loading && (
                        <div className="p-12 text-center text-slate-500 italic">
                            Không tìm thấy dữ liệu báo cáo nào.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
