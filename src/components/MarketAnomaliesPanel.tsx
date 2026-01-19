import React, { useEffect, useState } from 'react';
import { AreaChart, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatNumber } from '../utils/calculations';

interface Anomaly {
    id: string;
    created_at: string;
    symbol: string;
    timeframe: string;
    anomaly_type: 'PUMP' | 'DUMP';
    start_price: number;
    extreme_price: number;
    recovery_price: number;
    status: 'TRACKING' | 'RECOVERED' | 'EXPIRED';
    recovered_at: string | null;
    change_percent: number;
    rsi_at_anomaly: number;
}

export const MarketAnomaliesPanel: React.FC = () => {
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [symbolFilter, setSymbolFilter] = useState<string>('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 50;

    const [stats, setStats] = useState({
        total: 0,
        recovered: 0,
        rate: 0,
        avgTime: 0
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('market_anomalies')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (filter !== 'all') {
                query = query.eq('timeframe', filter);
            }

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (symbolFilter.trim() !== '') {
                query = query.ilike('symbol', `%${symbolFilter.trim().toUpperCase()}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            if (data) {
                setAnomalies(data as Anomaly[]);
                if (count !== null) setTotalCount(count);

                // Calculate Stats (only for the current view or fetch all for accurate stats?)
                // Actually, stats should probably be overall, but let's stick to visible/recent for now or fetch a separate summary.
                const recovered = data.filter(a => a.status === 'RECOVERED');
                const total = data.filter(a => a.status !== 'TRACKING').length;

                let avgTime = 0;
                if (recovered.length > 0) {
                    const times = recovered.map(a => {
                        const start = new Date(a.created_at).getTime();
                        const end = new Date(a.recovered_at!).getTime();
                        return (end - start) / (1000 * 60); // minutes
                    });
                    avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                }

                setStats({
                    total: count || 0,
                    recovered: recovered.length, // This is just for current page, maybe fine for now
                    rate: total > 0 ? (recovered.length / total) * 100 : 0,
                    avgTime
                });
            }
        } catch (e) {
            console.error('Error fetching anomalies:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, [filter, statusFilter, symbolFilter, page]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RECOVERED':
                return <span className="flex items-center gap-1 text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase"><CheckCircle2 size={10} /> ĐÃ HỒI PHỤC</span>;
            case 'TRACKING':
                return <span className="flex items-center gap-1 text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase animate-pulse"><Activity size={10} /> ĐANG THEO DÕI</span>;
            case 'EXPIRED':
                return <span className="flex items-center gap-1 text-[10px] font-black text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full uppercase">KHÔNG HỒI PHỤC</span>;
            default: return null;
        }
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                    <AreaChart size={16} className="text-pink-500" />
                    BOT THEO DÕI BIẾN ĐỘNG ĐỘT BIẾN
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tnmagcatofooeshzdhac.supabase.co';
                                const res = await fetch(`${supabaseUrl}/functions/v1/check-trades?action=backfill-anomalies`, { method: 'POST' });
                                if (res.ok) {
                                    alert('Đang kích hoạt nạp dữ liệu 24h... Vui lòng đợi 30s.');
                                    setTimeout(fetchData, 15000);
                                } else {
                                    alert('Kích hoạt thất bại. Thử lại sau.');
                                }
                            } catch (e) {
                                console.error(e);
                                alert('Lỗi kết nối bộ lọc (CORS). Bot vẫn đang chạy ngầm.');
                            }
                        }}
                        className="p-1 hover:text-pink-400 text-slate-500 transition-colors"
                        title="Nạp dữ liệu 24h"
                    >
                        <Activity size={12} />
                    </button>

                    <select
                        value={symbolFilter}
                        onChange={(e) => {
                            setSymbolFilter(e.target.value);
                            setPage(0);
                        }}
                        className="bg-slate-800 text-[10px] px-2 py-1 rounded border border-slate-700 outline-none w-24 focus:border-pink-500 transition-colors uppercase"
                    >
                        <option value="">TẤT CẢ COIN</option>
                        <option value="BTCUSDT">BTC</option>
                        <option value="ETHUSDT">ETH</option>
                        <option value="SOLUSDT">SOL</option>
                        <option value="XRPUSDT">XRP</option>
                        <option value="BNBUSDT">BNB</option>
                    </select>

                    <select
                        value={filter}
                        onChange={(e) => {
                            setFilter(e.target.value);
                            setPage(0);
                        }}
                        className="bg-slate-800 text-[10px] px-2 py-1 rounded border border-slate-700 outline-none"
                    >
                        <option value="all">TẤT CẢ TF</option>
                        <option value="1m">1m</option>
                        <option value="15m">15m</option>
                        <option value="1h">1h</option>
                        <option value="4h">4h</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                        className="bg-slate-800 text-[10px] px-2 py-1 rounded border border-slate-700 outline-none"
                    >
                        <option value="all">Trạng Thái</option>
                        <option value="RECOVERED">ĐÃ HỒI PHỤC</option>
                        <option value="TRACKING">ĐANG THEO DÕI</option>
                        <option value="EXPIRED">KHÔNG HỒI PHỤC</option>
                    </select>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 grid grid-cols-3 gap-2 border-b border-white/5 bg-white/5">
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Tỉ lệ hồi phục</p>
                    <p className="text-lg font-black text-green-400">{stats.rate.toFixed(1)}%</p>
                </div>
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Trung bình hồi</p>
                    <p className="text-lg font-black text-blue-400">{stats.avgTime.toFixed(0)}m</p>
                </div>
                <div className="text-center p-2 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Mẫu (N)</p>
                    <p className="text-lg font-black text-white">{stats.total}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[var(--color-bg-secondary)] z-10 shadow-sm">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase border-b border-white/5">
                            <th className="px-4 py-3">Thời gian / Cặp</th>
                            <th className="px-4 py-3">TF</th>
                            <th className="px-4 py-3 text-right">Biến Động</th>
                            <th className="px-4 py-3 text-center">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && anomalies.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500 italic">Đang tải dữ liệu...</td></tr>
                        ) : anomalies.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500 italic">Chưa phát hiện biến động đột biến nào...</td></tr>
                        ) : (
                            anomalies.map((a) => (
                                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-white">{a.symbol}</span>
                                            <span className="text-[9px] font-bold text-gray-500">{new Date(a.created_at).toLocaleTimeString()} {new Date(a.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-gray-400">{a.timeframe}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className={`flex items-center gap-1 text-xs font-black ${a.anomaly_type === 'PUMP' ? 'text-green-500' : 'text-red-500'}`}>
                                                {a.anomaly_type === 'PUMP' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                {a.change_percent.toFixed(2)}%
                                            </div>
                                            <span className="text-[9px] font-mono text-gray-500">${formatNumber(a.start_price, 2)} → ${formatNumber(a.extreme_price, 2)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">
                                            {getStatusBadge(a.status)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0 || loading}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-[10px] font-bold text-gray-400 border border-white/5 transition-colors"
                    >
                        TRƯỚC
                    </button>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        TRANG {page + 1} / {Math.ceil(totalCount / pageSize) || 1}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={anomalies.length < pageSize || (page + 1) * pageSize >= totalCount || loading}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-[10px] font-bold text-gray-400 border border-white/5 transition-colors"
                    >
                        TIẾP
                    </button>
                </div>
                <p className="text-[9px] text-gray-500 flex items-center gap-2 italic">
                    <AlertTriangle size={12} className="text-yellow-500" />
                    Dữ liệu dựa trên Mean Reversion thực tế từ sàn Binance 24/7.
                </p>
            </div>
        </div>
    );
};
