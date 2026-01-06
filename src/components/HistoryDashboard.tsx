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
}

export const HistoryDashboard: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    const fetchHistory = async () => {
        try {
            let query = supabase
                .from('trading_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (filter !== 'All') {
                query = query.eq('timeframe', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setHistory(data || []);
        } catch (e) {
            console.error('Error fetching history:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 15000); // Polling for updates
        return () => clearInterval(interval);
    }, [filter]);

    const deleteItem = async (id: string) => {
        try {
            const { error } = await supabase.from('trading_history').delete().eq('id', id);
            if (error) throw error;
            setHistory(history.filter(item => item.id !== id));
        } catch (e) {
            console.error('Error deleting item:', e);
        }
    };

    const successRate = history.filter(i => i.signal !== 'NEUTRAL').length > 0
        ? (history.filter(i => i.status === 'SUCCESS' && i.signal !== 'NEUTRAL').length /
            history.filter(i => i.status !== 'PENDING' && i.signal !== 'NEUTRAL').length * 100) || 0
        : 0;

    return (
        <div className="card h-full flex flex-col">
            <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                    <History size={16} className="text-[var(--color-golden)]" />
                    LỊCH SỬ ĐỀ XUẤT (SUPABASE)
                </div>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-slate-800 text-[10px] px-2 py-1 rounded border border-slate-700 outline-none"
                    >
                        <option value="All">All</option>
                        <option value="1 Phút">1m</option>
                        <option value="15 Phút">15m</option>
                        <option value="1 Giờ">1h</option>
                        <option value="4 Giờ">4h</option>
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
                        <div className="p-3 bg-slate-800/50 rounded-lg flex justify-between items-center border border-slate-700/50">
                            <span className="text-xs text-slate-400">Tỉ lệ thắng ({filter})</span>
                            <span className="text-lg font-black text-green-400">{successRate.toFixed(1)}%</span>
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
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500">Giá: ${item.price_at_signal}</span>
                                    <span className="text-slate-500">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
