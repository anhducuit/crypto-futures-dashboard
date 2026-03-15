import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, TrendingUp, CheckCircle2, Activity, BarChart3, Clock, PieChart, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
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
                return (
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--color-long)] bg-[var(--color-long)]/10 px-3 py-1 border border-[var(--color-long)]/20 rounded-[1px] uppercase tracking-widest italic">
                        <CheckCircle2 size={10} /> RECOVERY_COMPLETE
                    </span>
                );
            case 'TRACKING':
                return (
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--color-flare)] bg-[var(--color-flare)]/10 px-3 py-1 border border-[var(--color-flare)]/30 rounded-[1px] uppercase tracking-widest animate-pulse italic">
                        <Activity size={10} /> VECTOR_TRACKING
                    </span>
                );
            case 'EXPIRED':
                return (
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--color-silver)] bg-white/5 px-3 py-1 border border-white/10 rounded-[1px] uppercase tracking-widest opacity-40 italic">
                        RECOVERY_FAILED
                    </span>
                );
            default: return null;
        }
    };

    const getRecoveryDuration = (start: string, end: string | null) => {
        if (!end) return '-';
        const durationMs = new Date(end).getTime() - new Date(start).getTime();
        const minutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}H ${mins}M`;
        return `${mins}M`;
    };

    return (
        <div className="card h-full flex flex-col overflow-hidden p-0! flare-border reveal shadow-2xl">
            <div className="card-header justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] mb-0">
                <div className="flex items-center gap-3">
                    <Zap size={14} className="text-[var(--color-flare)]" />
                    <span className="font-black tracking-[0.2em] uppercase text-xs italic">Anomaly_Vector_Intelligence</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className={`p-2 rounded-[1px] border transition-all duration-300 ${showAnalytics ? 'bg-[var(--color-flare)] text-white border-[var(--color-flare)] shadow-[0_0_15px_var(--color-flare)]' : 'bg-white/5 text-[var(--color-silver)] border-white/10 hover:border-[var(--color-flare)]/50'}`}
                        title="Structural Analysis Report"
                    >
                        <BarChart3 size={14} />
                    </button>
                    <button
                        onClick={() => {
                            setPage(0);
                            fetchData();
                        }}
                        disabled={loading}
                        className="p-2 bg-white/5 text-[var(--color-silver)] border border-white/10 rounded-[1px] hover:text-[var(--color-flare)] hover:border-[var(--color-flare)]/50 transition-all disabled:opacity-50"
                        title="Sync Data"
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
                        className="p-2 bg-white/5 text-[var(--color-silver)] border border-white/10 rounded-[1px] hover:text-[var(--color-flare)] hover:border-[var(--color-flare)]/50 transition-all"
                        title="Legacy Protocol Backfill"
                    >
                        <Activity size={14} />
                    </button>

                    <div className="h-8 w-[1px] bg-white/5 mx-1"></div>

                    <select
                        value={symbolFilter}
                        onChange={(e) => {
                            setSymbolFilter(e.target.value);
                            setPage(0);
                        }}
                        className="bg-black/40 text-[9px] font-black px-3 py-1 rounded-[1px] border border-white/10 outline-none w-28 focus:border-[var(--color-flare)] transition-all uppercase tracking-widest italic"
                    >
                        <option value="">ALL_UNITS</option>
                        <option value="BTCUSDT">UNIT_BTC</option>
                        <option value="ETHUSDT">UNIT_ETH</option>
                        <option value="SOLUSDT">UNIT_SOL</option>
                        <option value="XRPUSDT">UNIT_XRP</option>
                        <option value="BNBUSDT">UNIT_BNB</option>
                    </select>

                    <select
                        value={filter}
                        onChange={(e) => {
                            setFilter(e.target.value);
                            setPage(0);
                        }}
                        className="bg-black/40 text-[9px] font-black px-3 py-1 rounded-[1px] border border-white/10 outline-none w-20 focus:border-[var(--color-flare)] uppercase tracking-widest italic"
                    >
                        <option value="all">ALL_TF</option>
                        <option value="1m">M1</option>
                        <option value="15m">M15</option>
                        <option value="1h">H1</option>
                        <option value="4h">H4</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                        className="bg-black/40 text-[9px] font-black px-3 py-1 rounded-[1px] border border-white/10 outline-none w-32 focus:border-[var(--color-flare)] uppercase tracking-widest italic"
                    >
                        <option value="all">ALL_PROTOCOLS</option>
                        <option value="RECOVERED">RECOVERY_COMPLETE</option>
                        <option value="TRACKING">VECTOR_TRACKING</option>
                        <option value="EXPIRED">RECOVERY_FAILED</option>
                    </select>
                </div>
            </div>

            {/* Analytics Section - Overhauled to structural report style */}
            {showAnalytics && analytics && (
                <div className="mx-4 mb-8 p-6 bg-black/40 rounded-[1px] border border-[var(--color-flare)]/20 grid grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    {/* Decorative scanner line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-flare)] to-transparent opacity-20 animate-pulse"></div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-[10px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] opacity-60">
                            <Clock size={12} className="text-[var(--color-flare)]" />
                            TF_Efficiency_Log
                        </div>
                        <div className="space-y-5">
                            {['1m', '15m', '1h', '4h'].map(tf => (
                                <div key={tf} className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black italic">
                                        <span className="text-[var(--color-flare)] font-mono uppercase tracking-widest">{tf}</span>
                                        <span className="text-white tracking-widest">{analytics.byTimeframe[tf]?.rate.toFixed(1) || 0}%</span>
                                    </div>
                                    <div className="h-[2px] bg-white/5 rounded-[1px] overflow-hidden border-x border-white/10">
                                        <div
                                            className="h-full bg-[var(--color-flare)] transition-all duration-1500 shadow-[0_0_10px_var(--color-flare)]"
                                            style={{ width: `${analytics.byTimeframe[tf]?.rate || 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[8px] font-bold text-[var(--color-silver)] opacity-30 italic">
                                        <span>Sample_Size</span>
                                        <span>N={analytics.byTimeframe[tf]?.total || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 border-x border-white/5 px-8">
                        <div className="flex items-center gap-3 text-[10px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] opacity-60">
                            <PieChart size={12} className="text-[var(--color-flare)]" />
                            Anomaly_Profiling
                        </div>
                        <div className="space-y-4">
                            {['PUMP', 'DUMP'].map(type => (
                                <div key={type} className="p-4 bg-white/5 border border-white/10 rounded-[1px] group hover:border-[var(--color-flare)]/30 transition-all duration-500">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`text-[11px] font-black italic tracking-[0.2em] ${type === 'PUMP' ? 'text-[var(--color-long)]' : 'text-[var(--color-short)]'}`}>{type}_VECTOR</span>
                                        <span className="text-xs font-black text-white font-mono">{analytics.byType[type]?.rate.toFixed(1) || 0}%</span>
                                    </div>
                                    <div className="text-[9px] font-bold text-[var(--color-silver)] opacity-30 italic uppercase tracking-widest">Confirmed_Events: {analytics.byType[type]?.total || 0}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 bg-[var(--color-flare)]/5 border-l border-l-[var(--color-flare)] rounded-[1px] text-[9px] text-[var(--color-silver)] leading-relaxed italic uppercase tracking-widest opacity-60">
                            Structural Confidence peak at N &gt; 50 samples. Vector integrity confirmed.
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-[10px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] opacity-60">
                            <TrendingUp size={12} className="text-[var(--color-flare)]" />
                            Primary_Structural_Assets
                        </div>
                        <div className="space-y-3">
                            {analytics.bestCoins.map((coin, i) => (
                                <div key={coin.symbol} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-[1px] hover:bg-[var(--color-flare)]/[0.03] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-[var(--color-flare)] opacity-30 italic font-mono">#{i + 1}</span>
                                        <span className="text-[10px] font-black text-white tracking-[0.2em] italic">{coin.symbol.replace('USDT', '')}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-[var(--color-long)] font-mono tracking-widest italic">{coin.rate.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats Overhauled */}
            <div className="px-4 py-6 grid grid-cols-3 gap-4 border-b border-white/5 bg-black/20">
                <div className="text-center p-4 bg-white/5 rounded-[1px] border-l border-l-[var(--color-long)] relative overflow-hidden group">
                    <p className="text-[8px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] mb-2 opacity-40 italic">Recovery_Index</p>
                    <p className="text-2xl font-black text-[var(--color-long)] font-mono tracking-tighter shadowed-text">{stats.rate.toFixed(1)}%</p>
                    <div className="absolute right-0 bottom-0 opacity-5 -rotate-12 translate-x-4 translate-y-4 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform">
                        <CheckCircle2 size={48} />
                    </div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-[1px] border-l border-l-[var(--color-flare)] relative overflow-hidden group">
                    <p className="text-[8px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] mb-2 opacity-40 italic">Mean_Vector_Time</p>
                    <p className="text-2xl font-black text-[var(--color-flare)] font-mono tracking-tighter shadowed-text">{stats.avgTime.toFixed(0)}M</p>
                    <div className="absolute right-0 bottom-0 opacity-5 -rotate-12 translate-x-4 translate-y-4 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform">
                        <Clock size={48} />
                    </div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-[1px] border-l border-l-white/20 relative overflow-hidden group">
                    <p className="text-[8px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] mb-2 opacity-40 italic">Population_N</p>
                    <p className="text-2xl font-black text-white font-mono tracking-tighter">{stats.total}</p>
                    <div className="absolute right-0 bottom-0 opacity-5 -rotate-12 translate-x-4 translate-y-4 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform">
                        <Activity size={48} />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[var(--color-bg-secondary)] z-10 backdrop-blur-xl">
                        <tr className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] border-b border-white/5 italic">
                            <th className="px-6 py-4">Structural_Timestamp</th>
                            <th className="px-6 py-4">Vector_TF</th>
                            <th className="px-6 py-4 text-center">Mean_Offset</th>
                            <th className="px-6 py-4 text-right">Intensity_Delta</th>
                            <th className="px-6 py-4 text-center">Status_Protocol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && anomalies.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-[10px] font-black text-[var(--color-silver)] italic tracking-[0.4em] animate-pulse">SYNCHRONIZING_TELEMETRY...</td></tr>
                        ) : anomalies.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-[10px] font-black text-[var(--color-silver)] italic tracking-[0.4em] opacity-40">NO_ANOMALIES_DETECTED_IN_SECTOR</td></tr>
                        ) : (
                            anomalies.map((a) => (
                                <tr key={a.id} className="hover:bg-white/5 transition-all duration-300 group cursor-default">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            <span className="text-xs font-black text-white tracking-widest italic group-hover:text-[var(--color-flare)] transition-colors">{a.symbol}</span>
                                            <span className="text-[8px] font-black text-[var(--color-silver)] font-mono opacity-40 tracking-widest uppercase">
                                                {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} // {new Date(a.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center!">
                                        <span className="px-2 py-0.5 border border-white/10 bg-white/5 rounded-[1px] text-[9px] font-black text-[var(--color-silver)] tracking-widest opacity-60 italic uppercase">{a.timeframe}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[10px] font-black font-mono tracking-widest italic ${a.status === 'RECOVERED' ? 'text-[var(--color-long)] opacity-80' : 'text-[var(--color-silver)] opacity-20'}`}>
                                            {a.status === 'RECOVERED' ? getRecoveryDuration(a.created_at, a.recovered_at) : (a.status === 'TRACKING' ? 'RECOVERY_IN_PROGRESS' : 'SYSTEM_TIMEOUT')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end space-y-1">
                                            <div className={`flex items-center gap-1.5 text-xs font-black italic tracking-widest ${a.anomaly_type === 'PUMP' ? 'text-[var(--color-long)]' : 'text-[var(--color-short)]'}`}>
                                                {a.anomaly_type === 'PUMP' ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                                                {a.change_percent.toFixed(2)}%
                                            </div>
                                            <span className="text-[9px] font-black font-mono text-[var(--color-silver)] opacity-30 italic">
                                                {formatNumber(a.start_price, 2)} → {formatNumber(a.extreme_price, 2)} [USD]
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center scale-90 group-hover:scale-100 transition-transform">
                                            {getStatusBadge(a.status)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0 || loading}
                        className="px-4 py-1.5 bg-white/5 hover:bg-[var(--color-flare)]/10 disabled:opacity-30 rounded-[1px] text-[9px] font-black text-[var(--color-silver)] border border-white/10 hover:border-[var(--color-flare)]/50 transition-all uppercase tracking-[0.2em] italic"
                    >
                        PREV_VEC
                    </button>
                    <span className="text-[9px] font-black font-mono text-[var(--color-flare)] uppercase tracking-[0.4em] italic px-4">
                        SECTOR_{page + 1} / {Math.ceil(totalCount / pageSize) || 1}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={anomalies.length < pageSize || (page + 1) * pageSize >= totalCount || loading}
                        className="px-4 py-1.5 bg-white/5 hover:bg-[var(--color-flare)]/10 disabled:opacity-30 rounded-[1px] text-[9px] font-black text-[var(--color-silver)] border border-white/10 hover:border-[var(--color-flare)]/50 transition-all uppercase tracking-[0.2em] italic"
                    >
                        NEXT_VEC
                    </button>
                </div>
                <div className="flex items-center gap-3 text-[8px] font-black text-[var(--color-silver)] opacity-30 italic uppercase tracking-[0.3em]">
                    <AlertTriangle size={12} className="text-[var(--color-flare)] opacity-100 animate-pulse" />
                    Mean Reversion structural protocol // binance_data_stream // 24/7_INTEL
                </div>
            </div>
        </div>
    );
};
