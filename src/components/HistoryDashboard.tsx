/**
 * Copyright © 2026 Anh Duc Trader. All rights reserved.
 */
import React, { useEffect, useState } from 'react';
import { History, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HistoryItem {
    id: string;
    created_at: string;
    symbol: string;
    timeframe: string;
    signal: string;
    price_at_signal: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    rsi: number;
    volume_ratio: number;
    target_price?: number;
    stop_loss?: number;
}

interface HistoryDashboardProps {
    symbol?: string;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ symbol }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const fetchHistory = async () => {
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('trading_history')
                .select('*', { count: 'exact' })
                .neq('signal', 'NEUTRAL') // Hide SIDELINES
                .order('created_at', { ascending: false })
                .range(from, to);

            // Filter by symbol if provided
            if (symbol) {
                query = query.eq('symbol', symbol);
            }

            if (filter !== 'All') {
                query = query.eq('timeframe', filter);
            }

            if (statusFilter !== 'All') {
                query = query.eq('status', statusFilter);
                // If filtering by WIN/LOSS, we only want actionable signals (LONG/SHORT)
                if (statusFilter === 'SUCCESS' || statusFilter === 'FAILED') {
                    query = query.neq('signal', 'NEUTRAL');
                }
            }

            const { data, error, count } = await query;
            if (error) throw error;
            setHistory(data || []);
            if (count !== null) setTotalCount(count);
        } catch (e) {
            console.error('Error fetching history:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchStats();
        const interval = setInterval(() => {
            fetchHistory();
            fetchStats();
        }, 15000);
        return () => clearInterval(interval);
    }, [filter, statusFilter, page, symbol]);

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setPage(1); // Reset to page 1 on filter change
    };

    const handleStatusFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        setPage(1);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const deleteItem = async (id: string) => {
        try {
            const { error } = await supabase.from('trading_history').delete().eq('id', id);
            if (error) throw error;
            setHistory(history.filter(item => item.id !== id));
        } catch (e) {
            console.error('Error deleting item:', e);
        }
    };

    const [successRate, setSuccessRate] = useState(0);
    const [lossRate, setLossRate] = useState(0);
    const [winCount, setWinCount] = useState(0);
    const [lossCount, setLossCount] = useState(0);

    const fetchStats = async () => {
        try {
            // Count total actionable trades (excluding NEUTRAL and PENDING)
            let totalQuery = supabase
                .from('trading_history')
                .select('*', { count: 'exact', head: true })
                .neq('signal', 'NEUTRAL')
                .neq('status', 'PENDING');

            // Count total SUCCESS trades
            let successQuery = supabase
                .from('trading_history')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'SUCCESS')
                .neq('signal', 'NEUTRAL');

            // Count total FAILED trades
            let failedQuery = supabase
                .from('trading_history')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'FAILED')
                .neq('signal', 'NEUTRAL');

            if (symbol) {
                totalQuery = totalQuery.eq('symbol', symbol);
                successQuery = successQuery.eq('symbol', symbol);
                failedQuery = failedQuery.eq('symbol', symbol);
            }

            if (filter !== 'All') {
                totalQuery = totalQuery.eq('timeframe', filter);
                successQuery = successQuery.eq('timeframe', filter);
                failedQuery = failedQuery.eq('timeframe', filter);
            }

            const [totalRes, successRes, failedRes] = await Promise.all([totalQuery, successQuery, failedQuery]);

            const totalActionable = totalRes.count || 0;
            const totalSuccess = successRes.count || 0;
            const totalFailed = failedRes.count || 0;

            setWinCount(totalSuccess);
            setLossCount(totalFailed);
            setSuccessRate(totalActionable > 0 ? (totalSuccess / totalActionable) * 100 : 0);
            setLossRate(totalActionable > 0 ? (totalFailed / totalActionable) * 100 : 0);
        } catch (e) {
            console.error('Error fetching stats:', e);
        }
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                    <History size={16} className="text-[var(--color-golden)]" />
                    LỊCH SỬ ĐỀ XUẤT ({symbol || 'ALL'})
                </div>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="bg-slate-800 text-[10px] px-2 py-1 rounded border border-slate-700 outline-none"
                    >
                        <option value="All">All</option>
                        <option value="1 Phút">1m</option>
                        <option value="15 Phút">15m</option>
                        <option value="1 Giờ">1h</option>
                        <option value="4 Giờ">4h</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                        className="bg-slate-800 text-[10px] px-2 py-1 rounded border border-slate-700 outline-none"
                    >
                        <option value="All">Status</option>
                        <option value="SUCCESS">WIN</option>
                        <option value="FAILED">LOSS</option>
                        <option value="PENDING">PENDING</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loading ? (
                    <div className="text-center py-4 text-slate-500">Đang tải...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs">Chưa có lịch sử đề xuất</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-slate-800/50 rounded-lg flex flex-col items-center border border-slate-700/50">
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Tỉ lệ thắng ({filter})</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-green-400">{successRate.toFixed(1)}%</span>
                                    <span className="text-[10px] text-slate-500">({winCount} lệnh)</span>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-lg flex flex-col items-center border border-slate-700/50">
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Tỉ lệ thua ({filter})</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-red-400">{lossRate.toFixed(1)}%</span>
                                    <span className="text-[10px] text-slate-500">({lossCount} lệnh)</span>
                                </div>
                            </div>
                        </div>

                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-2 border border-slate-700/30 relative group"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${item.signal === 'LONG' ? 'bg-green-500/20 text-green-400' :
                                            item.signal === 'SHORT' ? 'bg-red-500/20 text-red-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {item.signal === 'NEUTRAL' ? 'SIDELINES' : item.signal}
                                        </span>
                                        <span className="text-xs font-bold">{item.symbol}</span>
                                        <span className="text-[10px] text-slate-500">{item.timeframe}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.status === 'SUCCESS' ? (
                                            <CheckCircle2 size={14} className="text-green-500" />
                                        ) : item.status === 'FAILED' ? (
                                            <XCircle size={14} className="text-red-500" />
                                        ) : (
                                            <Clock size={14} className="text-yellow-500 animate-pulse" />
                                        )}
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Entry:</span>
                                        <span className="text-slate-300 font-bold">${item.price_at_signal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Volume:</span>
                                        <span className={`font-bold ${item.volume_ratio > 1.2 ? 'text-blue-400' : 'text-slate-400'}`}>
                                            {item.volume_ratio ? item.volume_ratio.toFixed(2) : '1.00'}x
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Target:</span>
                                        <span className="text-green-500/80">${item.target_price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">RSI:</span>
                                        <span className="text-slate-300">{item.rsi ? item.rsi.toFixed(1) : '--'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">StopLoss:</span>
                                        <span className="text-red-500/80">${item.stop_loss}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Time:</span>
                                        <span className="text-slate-400">
                                            {(() => {
                                                const d = new Date(item.created_at);
                                                const hh = d.getHours().toString().padStart(2, '0');
                                                const mm = d.getMinutes().toString().padStart(2, '0');
                                                const day = d.getDate().toString().padStart(2, '0');
                                                const mo = (d.getMonth() + 1).toString().padStart(2, '0');
                                                return `${hh}:${mm} ${day}/${mo}`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-1 py-4 border-t border-slate-800 mt-4">
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                    className="px-2 py-1 bg-slate-800 rounded text-[10px] disabled:opacity-30 hover:bg-slate-700 transition-colors"
                                >
                                    Đầu
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-2 py-1 bg-slate-800 rounded text-[10px] disabled:opacity-30 hover:bg-slate-700 transition-colors"
                                >
                                    Trước
                                </button>

                                <span className="px-3 text-[10px] text-slate-400">
                                    Trang <span className="text-[var(--color-golden)] font-bold">{page}</span> / {totalPages}
                                </span>

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-2 py-1 bg-slate-800 rounded text-[10px] disabled:opacity-30 hover:bg-slate-700 transition-colors"
                                >
                                    Sau
                                </button>
                                <button
                                    onClick={() => setPage(totalPages)}
                                    disabled={page === totalPages}
                                    className="px-2 py-1 bg-slate-800 rounded text-[10px] disabled:opacity-30 hover:bg-slate-700 transition-colors"
                                >
                                    Cuối
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
