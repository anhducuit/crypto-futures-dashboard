import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, TrendingUp, TrendingDown, CheckCircle2, Activity, Info, BarChart3, Clock, ArrowRight, AreaChart, PieChart, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
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

    const [analytics, setAnalytics] = useState<{
        byTimeframe: Record<string, { total: number, rate: number }>,
        byType: Record<string, { total: number, rate: number }>,
        bestCoins: { symbol: string, rate: number }[]
    } | null>(null);

    const [showAnalytics, setShowAnalytics] = useState(false);

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

                // Quick view stats
                const recovered = data.filter(a => a.status === 'RECOVERED');
                const total = data.filter(a => a.status !== 'TRACKING').length;
                let avgTime = 0;
                if (recovered.length > 0) {
                    const times = recovered.map(a => {
                        const start = new Date(a.created_at).getTime();
                        const end = new Date(a.recovered_at!).getTime();
                        return (end - start) / (1000 * 60);
                    });
                    avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                }

                setStats({
                    total: count || 0,
                    recovered: recovered.length,
                    rate: total > 0 ? (recovered.length / total) * 100 : 0,
                    avgTime
                });
            }

            // Fetch Global Analytics (ignore filters for this)
            const { data: allData } = await supabase
                .from('market_anomalies')
                .select('timeframe, status, anomaly_type, symbol')
                .neq('status', 'TRACKING');

            if (allData) {
                const tfMap: Record<string, { total: number, rec: number }> = {};
                const typeMap: Record<string, { total: number, rec: number }> = {};
                const coinMap: Record<string, { total: number, rec: number }> = {};

                allData.forEach(a => {
                    // By Timeframe
                    if (!tfMap[a.timeframe]) tfMap[a.timeframe] = { total: 0, rec: 0 };
                    tfMap[a.timeframe].total++;
                    if (a.status === 'RECOVERED') tfMap[a.timeframe].rec++;

                    // By Type
                    if (!typeMap[a.anomaly_type]) typeMap[a.anomaly_type] = { total: 0, rec: 0 };
                    typeMap[a.anomaly_type].total++;
                    if (a.status === 'RECOVERED') typeMap[a.anomaly_type].rec++;

                    // By Coin
                    if (!coinMap[a.symbol]) coinMap[a.symbol] = { total: 0, rec: 0 };
                    coinMap[a.symbol].total++;
                    if (a.status === 'RECOVERED') coinMap[a.symbol].rec++;
                });

                const analyticsData = {
                    byTimeframe: Object.fromEntries(Object.entries(tfMap).map(([k, v]) => [k, { total: v.total, rate: (v.rec / v.total) * 100 }])),
                    byType: Object.fromEntries(Object.entries(typeMap).map(([k, v]) => [k, { total: v.total, rate: (v.rec / v.total) * 100 }])),
                    bestCoins: Object.entries(coinMap)
                        .map(([k, v]) => ({ symbol: k, rate: (v.rec / v.total) * 100 }))
                        .sort((a, b) => b.rate - a.rate)
                        .slice(0, 3)
                };
                setAnalytics(analyticsData);
            }

        } catch (e) {
            console.error('Error fetching anomalies:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // 1 minute
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

    const getRecoveryDuration = (start: string, end: string | null) => {
        if (!end) return '-';
        const durationMs = new Date(end).getTime() - new Date(start).getTime();
        const minutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-pink-500" />
                    BOT THEO DÕI BIẾN ĐỘNG
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className={`p-1.5 rounded transition-colors ${showAnalytics ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-pink-400'}`}
                        title="Báo cáo chuyên sâu"
                    >
                        <BarChart3 size={14} />
                    </button>
                    <button
                        onClick={() => {
                            setPage(0);
                            fetchData();
                        }}
                        disabled={loading}
                        className="p-1.5 bg-slate-800 text-slate-400 rounded hover:text-pink-400 disabled:opacity-50"
                        title="Tải lại"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                const response = await fetch(`${supabase.storage.from('check-trades').getPublicUrl('check-trades').data.publicUrl}?action=backfill-anomalies`);
                                if (response.ok) fetchData();
                            } catch (e) {
                                console.error('Backfill error:', e);
                            }
                        }}
                        className="p-1.5 bg-slate-800 text-slate-400 rounded hover:text-pink-400"
                        title="Nạp dữ liệu cũ"
                    >
                        <Activity size={14} />
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

            {/* Analytics Section */}
            {showAnalytics && analytics && (
                <div className="mx-4 mb-4 p-4 bg-slate-900/50 rounded-lg border border-pink-500/20 grid grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Clock size={12} className="text-pink-400" />
                            Hiệu suất theo khung giờ
                        </div>
                        <div className="space-y-4">
                            {['1m', '15m', '1h', '4h'].map(tf => (
                                <div key={tf} className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-300 font-mono uppercase">{tf}</span>
                                        <span className="text-pink-400 font-bold">{analytics.byTimeframe[tf]?.rate.toFixed(1) || 0}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-pink-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${analytics.byTimeframe[tf]?.rate || 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-[8px] text-slate-500 text-right">Mẫu: {analytics.byTimeframe[tf]?.total || 0}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <PieChart size={12} className="text-pink-400" />
                            Đặc tính biến động
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {['PUMP', 'DUMP'].map(type => (
                                <div key={type} className="p-3 bg-slate-800/40 rounded border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[10px] font-black ${type === 'PUMP' ? 'text-green-500' : 'text-red-500'}`}>{type}</span>
                                        <span className="text-xs font-bold text-white">{analytics.byType[type]?.rate.toFixed(1) || 0}% hồi</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500">Tín hiệu ghi nhận: {analytics.byType[type]?.total || 0}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-2 bg-blue-500/5 rounded border border-blue-500/10 text-[9px] text-blue-300 leading-relaxed italic">
                            💡 Mẹo: Khung giờ có mẫu (N) > 50 sẽ có độ tin cậy thống kê cao nhất.
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <TrendingUp size={12} className="text-pink-400" />
                            Top Coin hồi tốt nhất
                        </div>
                        <div className="space-y-2">
                            {analytics.bestCoins.map((coin, i) => (
                                <div key={coin.symbol} className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-700/30">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-500 italic">#{i + 1}</span>
                                        <span className="text-[10px] font-bold text-slate-200">{coin.symbol.replace('USDT', '')}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-green-400">{coin.rate.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                            <th className="px-4 py-3 text-center">Thời gian hồi</th>
                            <th className="px-4 py-3 text-right">Biến Động</th>
                            <th className="px-4 py-3 text-center">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && anomalies.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500 italic">Đang tải dữ liệu...</td></tr>
                        ) : anomalies.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500 italic">Chưa phát hiện biến động đột biến nào...</td></tr>
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
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-[10px] font-mono ${a.status === 'RECOVERED' ? 'text-blue-400' : 'text-gray-600'}`}>
                                            {a.status === 'RECOVERED' ? getRecoveryDuration(a.created_at, a.recovered_at) : (a.status === 'TRACKING' ? 'Đang hồi...' : '-')}
                                        </span>
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
