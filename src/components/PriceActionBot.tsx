import React, { useState, useEffect, useCallback } from 'react';
import {
    Zap,
    ShieldAlert,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PriceActionSignal {
    id: string;
    created_at: string;
    symbol: string;
    timeframe: string;
    signal_type: 'LONG' | 'SHORT';
    pattern_type: string;
    pattern_strength: string;
    entry_price: number;
    stop_loss: number;
    target_price: number;
    risk_reward_ratio: number;
    market_trend: string;
    sd_zone_type: string;
    sd_zone_strength: string;
    confluence_factors: string[];
    confluence_score: number;
    status: 'PENDING' | 'ACTIVE' | 'WIN' | 'LOSS';
}

export const PriceActionBot: React.FC = () => {
    const [signals, setSignals] = useState<PriceActionSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: 'ALL',
        minConfluence: 0,
        symbol: '',
        timeframe: 'all'
    });
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 15;

    const [stats, setStats] = useState({
        total: 0,
        winRate: 0,
        active: 0,
        avgRR: 0
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('price_action_signals')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (filter.status !== 'ALL') {
                query = query.eq('status', filter.status);
            }

            if (filter.minConfluence > 0) {
                query = query.gte('confluence_score', filter.minConfluence);
            }

            if (filter.symbol) {
                query = query.ilike('symbol', `%${filter.symbol.toUpperCase()}%`);
            }

            if (filter.timeframe !== 'all') {
                query = query.eq('timeframe', filter.timeframe);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            if (data) {
                setSignals(data as PriceActionSignal[]);
                setTotalCount(count || 0);

                // Calculate basic stats for display
                const total = count || 0;
                const wins = data.filter(s => s.status === 'WIN').length;
                const active = data.filter(s => s.status === 'ACTIVE').length;
                const avgRR = data.reduce((acc, s) => acc + s.risk_reward_ratio, 0) / (data.length || 1);

                setStats({
                    total,
                    winRate: total > 0 ? (wins / total) * 100 : 0,
                    active,
                    avgRR
                });
            }
        } catch (error) {
            console.error('Error fetching PA signals:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, page]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // 1 minute refresh
        return () => clearInterval(interval);
    }, [fetchData]);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            'PENDING': 'bg-slate-700 text-slate-300',
            'ACTIVE': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'WIN': 'bg-green-500/20 text-green-400 border-green-500/30',
            'LOSS': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        const labels: Record<string, string> = {
            'PENDING': 'CHỜ',
            'ACTIVE': 'ĐANG CHẠY',
            'WIN': 'THẮNG',
            'LOSS': 'THUA'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${badges[status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getConfluenceColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-orange-400';
    };

    return (
        <div className="card h-full flex flex-col shadow-2xl overflow-hidden p-0! border-[var(--color-border)]">
            {/* Header */}
            <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Zap size={18} className="text-white fill-current" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white tracking-tight uppercase">PRICE ACTION BOT</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bot #3 • Scanning</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="TÌM CẶP..."
                            value={filter.symbol}
                            onChange={(e) => {
                                setFilter({ ...filter, symbol: e.target.value });
                                setPage(0);
                            }}
                            className="bg-slate-800 text-[10px] px-3 py-1.5 rounded-lg border border-slate-700 outline-none w-24 focus:border-pink-500 focus:w-32 transition-all uppercase font-bold text-slate-200 placeholder:text-slate-600"
                        />
                    </div>

                    <select
                        value={filter.timeframe}
                        onChange={(e) => {
                            setFilter({ ...filter, timeframe: e.target.value });
                            setPage(0);
                        }}
                        className="bg-slate-800 text-[10px] px-2 py-1.5 rounded-lg border border-slate-700 outline-none text-slate-300 font-bold focus:border-pink-500 transition-colors cursor-pointer"
                    >
                        <option value="all">TẤT CẢ TF</option>
                        <option value="1m">1M</option>
                        <option value="15m">15M</option>
                        <option value="1h">1H</option>
                        <option value="4h">4H</option>
                    </select>

                    <select
                        value={filter.status}
                        onChange={(e) => {
                            setFilter({ ...filter, status: e.target.value });
                            setPage(0);
                        }}
                        className="bg-slate-800 text-[10px] px-2 py-1.5 rounded-lg border border-slate-700 outline-none text-slate-300 font-bold focus:border-pink-500 transition-colors cursor-pointer"
                    >
                        <option value="ALL">TRẠNG THÁI</option>
                        <option value="PENDING">CHỜ</option>
                        <option value="ACTIVE">ĐANG CHẠY</option>
                        <option value="WIN">THẮNG</option>
                        <option value="LOSS">THUA</option>
                    </select>

                    <select
                        value={filter.minConfluence}
                        onChange={(e) => {
                            setFilter({ ...filter, minConfluence: parseInt(e.target.value) });
                            setPage(0);
                        }}
                        className="bg-slate-800 text-[10px] px-2 py-1.5 rounded-lg border border-slate-700 outline-none text-slate-300 font-bold focus:border-pink-500 transition-colors cursor-pointer"
                    >
                        <option value="0">TẤT CẢ ĐIỂM</option>
                        <option value="40">SCORE ≥ 40</option>
                        <option value="60">SCORE ≥ 60</option>
                        <option value="80">SCORE ≥ 80</option>
                    </select>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 grid grid-cols-3 gap-2 border-b border-white/5 bg-white/5">
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Tỷ lệ thắng (Est)</p>
                    <p className="text-lg font-black text-green-400">{stats.winRate.toFixed(1)}%</p>
                </div>
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">R:R Trung bình</p>
                    <p className="text-lg font-black text-blue-400">{stats.avgRR.toFixed(1)}</p>
                </div>
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Tổng tín hiệu</p>
                    <p className="text-lg font-black text-white">{totalCount}</p>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[var(--color-bg-secondary)] z-10 shadow-sm">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase border-b border-white/5">
                            <th className="px-4 py-3">Thời gian / Cặp</th>
                            <th className="px-4 py-3">Loại / Pattern</th>
                            <th className="px-4 py-3 text-center">Confluence</th>
                            <th className="px-4 py-3 text-right">Giá / Target</th>
                            <th className="px-4 py-3 text-center">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && signals.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500 italic">Đang phân tích dữ liệu Price Action...</td></tr>
                        ) : signals.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500 italic">Chưa phát hiện tín hiệu Price Action nào phù hợp...</td></tr>
                        ) : (
                            signals.map((s) => (
                                <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.signal_type === 'LONG' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <span className="text-xs font-black text-white uppercase">{s.symbol.replace('USDT', '')}</span>
                                                <span className="text-[9px] font-bold px-1 py-0.5 bg-white/5 rounded text-gray-500">{s.timeframe}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">
                                                {new Date(s.created_at).toLocaleTimeString('vi-VN')} {new Date(s.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <div className="flex flex-col">
                                            <span className={`font-black tracking-widest ${s.signal_type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                                                {s.signal_type}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase">
                                                {s.pattern_type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-xs font-black ${getConfluenceColor(s.confluence_score)}`}>
                                                {s.confluence_score}%
                                            </span>
                                            <span className="text-[8px] font-bold text-gray-600 uppercase">
                                                {s.confluence_factors.length} factors
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-[10px] font-mono text-white">
                                                ${s.entry_price.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-mono text-green-400 mt-0.5">
                                                TP: ${s.target_price.toLocaleString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">
                                            {getStatusBadge(s.status)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination */}
            <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0 || loading}
                        className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-gray-400 border border-white/5 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-1 px-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Trang</span>
                        <span className="text-[10px] font-black text-white">{page + 1}</span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase">/ {Math.ceil(totalCount / pageSize) || 1}</span>
                    </div>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={signals.length < pageSize || (page + 1) * pageSize >= totalCount || loading}
                        className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-gray-400 border border-white/5 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 italic flex items-center gap-1.5">
                        <ShieldAlert size={12} className="text-yellow-500" />
                        Phát hiện Price Action thời gian thực.
                    </span>
                </div>
            </div>
        </div>
    );
};
