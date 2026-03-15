import React, { useEffect, useState } from 'react';
import { History, CheckCircle2, XCircle, Clock, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PnLShareModal } from './PnLShareModal';
import { useTranslation, type Language } from '../utils/translations';

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
    trade_id?: string;
    pnl_reason?: string;
    strategy_name?: string;
}

interface HistoryDashboardProps {
    symbol?: string;
    language: Language;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ symbol, language }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [localSymbol, setLocalSymbol] = useState(symbol || 'All');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [sharingItem, setSharingItem] = useState<HistoryItem | null>(null);
    const t = useTranslation(language);
    const ITEMS_PER_PAGE = 15;

    const symbols = ['All', 'BTCUSDT', 'ETHUSDT', 'XAUUSDT', 'XAGUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'NEARUSDT', 'TIAUSDT'];

    const fetchHistory = async () => {
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('trading_history')
                .select('*', { count: 'exact' })
                .neq('signal', 'NEUTRAL')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (localSymbol !== 'All') {
                query = query.eq('symbol', localSymbol);
            }

            if (filter !== 'All') {
                query = query.eq('timeframe', filter);
            }

            if (statusFilter !== 'All') {
                query = query.eq('status', statusFilter);
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
        if (symbol) setLocalSymbol(symbol);
    }, [symbol]);

    useEffect(() => {
        fetchHistory();
        fetchStats();
        const interval = setInterval(() => {
            fetchHistory();
            fetchStats();
        }, 15000);
        return () => clearInterval(interval);
    }, [filter, statusFilter, page, localSymbol]);

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setPage(1);
    };

    const handleStatusFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        setPage(1);
    };

    const handleSymbolChange = (newSym: string) => {
        setLocalSymbol(newSym);
        setPage(1);
    };


    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const [successRate, setSuccessRate] = useState(0);
    const [lossRate, setLossRate] = useState(0);
    const [winCount, setWinCount] = useState(0);
    const [lossCount, setLossCount] = useState(0);

    const fetchStats = async () => {
        try {
            let totalQuery = supabase
                .from('trading_history')
                .select('*', { count: 'exact', head: true })
                .neq('signal', 'NEUTRAL')
                .neq('status', 'PENDING');

            let successQuery = supabase
                .from('trading_history')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'SUCCESS')
                .neq('signal', 'NEUTRAL');

            let failedQuery = supabase
                .from('trading_history')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'FAILED')
                .neq('signal', 'NEUTRAL');

            if (localSymbol !== 'All') {
                totalQuery = totalQuery.eq('symbol', localSymbol);
                successQuery = successQuery.eq('symbol', localSymbol);
                failedQuery = failedQuery.eq('symbol', localSymbol);
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
        <div className="card h-full flex flex-col overflow-hidden p-0! flare-border shadow-2xl reveal">
            <div className="card-header justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] mb-0">
                <div className="flex items-center gap-3">
                    <History size={14} className="text-[var(--color-flare)]" />
                    <span className="font-black tracking-[0.2em] uppercase text-[10px] text-white italic">
                        {t('history_title')} [{localSymbol === 'All' ? 'GLOBAL' : localSymbol.replace('USDT', '')}]
                    </span>
                </div>
                <div className="flex gap-2">
                    <select
                        value={localSymbol}
                        onChange={(e) => handleSymbolChange(e.target.value)}
                        className="bg-[var(--color-bg-secondary)] text-[9px] font-black px-3 py-1 rounded-[1px] border border-white/10 outline-none min-w-[90px] focus:border-[var(--color-flare)] transition-all uppercase tracking-widest italic"
                    >
                        {symbols.map(s => (
                            <option key={s} value={s} className="bg-[var(--color-bg-secondary)] text-white">
                                {s === 'All' ? t('all_units') : `${t('unit_prefix')}${s.replace('USDT', '')}`}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="bg-[var(--color-bg-secondary)] text-[9px] font-black px-3 py-1 rounded-[1px] border border-white/10 outline-none focus:border-[var(--color-flare)] uppercase tracking-widest italic"
                    >
                        <option value="All" className="bg-[var(--color-bg-secondary)] text-white">{t('all_tf')}</option>
                        <option value="1m" className="bg-[var(--color-bg-secondary)] text-white">M1</option>
                        <option value="15m" className="bg-[var(--color-bg-secondary)] text-white">M15</option>
                        <option value="1h" className="bg-[var(--color-bg-secondary)] text-white">H1</option>
                        <option value="4h" className="bg-[var(--color-bg-secondary)] text-white">H4</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                        className="bg-[var(--color-bg-secondary)] text-[9px] font-black px-3 py-1 rounded-[1px] border border-white/10 outline-none focus:border-[var(--color-flare)] uppercase tracking-widest italic"
                    >
                        <option value="All" className="bg-[var(--color-bg-secondary)] text-white">{t('all_status')}</option>
                        <option value="SUCCESS" className="bg-[var(--color-bg-secondary)] text-white">{t('win_logs')}</option>
                        <option value="FAILED" className="bg-[var(--color-bg-secondary)] text-white">{t('loss_logs')}</option>
                        <option value="PENDING" className="bg-[var(--color-bg-secondary)] text-white">{t('active_vouchers')}</option>
                    </select>
                </div>
            </div>

            {/* Sticky Stats Row - Overhauled to Lab Style */}
            {!loading && history.length > 0 && (
                <div className="flex items-center gap-6 px-4 py-3 border-b border-white/5 bg-black/20 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-widest opacity-40 italic">{t('win_efficiency')}:</span>
                        <span className="text-base font-black text-[var(--color-long)] font-mono tracking-tighter shadowed-text">{successRate.toFixed(1)}%</span>
                        <span className="text-[10px] font-bold text-[var(--color-silver)] opacity-20 font-mono">N={winCount}</span>
                    </div>
                    <div className="w-[1px] h-4 bg-white/5"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-widest opacity-40 italic">{t('loss_delta')}:</span>
                        <span className="text-base font-black text-[var(--color-short)] font-mono tracking-tighter shadowed-text">{lossRate.toFixed(1)}%</span>
                        <span className="text-[10px] font-bold text-[var(--color-silver)] opacity-20 font-mono">N={lossCount}</span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {loading ? (
                    <div className="text-center py-12 text-[10px] font-black text-[var(--color-silver)] italic tracking-[0.4em] animate-pulse">{t('syncing_logs')}</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 text-[10px] font-black text-[var(--color-silver)] italic tracking-[0.4em] opacity-40">{t('no_execution_data')}</div>
                ) : (
                    <>
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 bg-white/[0.02] rounded-[1px] space-y-4 border border-white/5 hover:border-[var(--color-flare)]/30 transition-all duration-500 relative group overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-flare)] opacity-[0.02] blur-3xl -translate-y-16 translate-x-16 pointer-events-none"></div>
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-[1px] border italic tracking-widest uppercase ${item.signal === 'LONG' ? 'border-[var(--color-long)]/30 bg-[var(--color-long)]/10 text-[var(--color-long)]' :
                                            item.signal === 'SHORT' ? 'border-[var(--color-short)]/30 bg-[var(--color-short)]/10 text-[var(--color-short)]' :
                                                'border-white/20 bg-white/5 text-[var(--color-silver)]'
                                            }`}>
                                            {item.signal === 'NEUTRAL' ? t('sidelines') : item.signal}
                                        </span>
                                        <span className="text-[13px] font-black text-white tracking-[0.1em] italic">{item.symbol.replace('USDT', '')}</span>
                                        {item.trade_id && (
                                            <span className="text-[9px] font-black font-mono text-[var(--color-flare)] bg-[var(--color-flare)]/10 px-1.5 py-0.5 rounded-[1px] tracking-widest italic opacity-60">
                                                ID_{item.trade_id}
                                            </span>
                                        )}
                                        {item.strategy_name && (
                                            <span className="hidden sm:inline-block text-[8px] font-black text-[var(--color-flare)] bg-white/5 px-2 py-1 rounded-[1px] border border-white/10 uppercase tracking-widest italic opacity-40 group-hover:opacity-80 transition-opacity">
                                                {t('protocol')}: {t('protocol', item.strategy_name)}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-black text-[var(--color-silver)] opacity-30 italic">{item.timeframe}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center px-2 py-1 bg-black/40 border border-white/5 rounded-[1px] scale-90 group-hover:scale-100 transition-transform duration-500">
                                            {item.status === 'SUCCESS' ? (
                                                <div className="flex items-center gap-2 text-[var(--color-long)]">
                                                    <CheckCircle2 size={10} strokeWidth={3} />
                                                    <span className="text-[8px] font-black tracking-widest italic">{t('confirmed').toUpperCase()}</span>
                                                </div>
                                            ) : item.status === 'FAILED' ? (
                                                <div className="flex items-center gap-2 text-[var(--color-short)]">
                                                    <XCircle size={10} strokeWidth={3} />
                                                    <span className="text-[8px] font-black tracking-widest italic">{t('liquidated').toUpperCase()}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[var(--color-flare)] animate-pulse">
                                                    <Clock size={10} strokeWidth={3} />
                                                    <span className="text-[8px] font-black tracking-widest italic">{t('pending_exec').toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>
                                        {item.status !== 'PENDING' && (
                                            <button
                                                onClick={() => setSharingItem(item)}
                                                className="p-1 text-[var(--color-silver)] opacity-30 hover:opacity-100 hover:text-[var(--color-flare)] transition-all"
                                            >
                                                <Share2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-[10px] relative z-10 border-t border-white/5 pt-3">
                                    <div className="space-y-0.5">
                                        <span className="text-[8px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-widest italic">{t('entry')}</span>
                                        <div className="text-[11px] font-black text-white font-mono tracking-widest italic">${Number(item.price_at_signal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[8px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-widest italic">{t('target')}</span>
                                        <div className="text-[11px] font-black text-[var(--color-long)] font-mono tracking-widest italic">${Number(item.target_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[8px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-widest italic">{t('stop_loss')}</span>
                                        <div className="text-[11px] font-black text-[var(--color-short)] font-mono tracking-widest italic">${Number(item.stop_loss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[8px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-widest italic">{t('vol_impact')}</span>
                                        <div className={`text-[9px] font-black font-mono tracking-widest italic ${item.volume_ratio > 1.2 ? 'text-[var(--color-flare)]' : 'text-white/40'}`}>
                                            {item.volume_ratio ? item.volume_ratio.toFixed(2) : '1.00'} [X]
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[8px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-widest italic">{t('engine_rsi')}</span>
                                        <div className="text-[9px] font-black text-white font-mono tracking-widest italic">{item.rsi ? item.rsi.toFixed(1) : '---'}</div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[8px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-widest italic">{t('temporal_marker')}</span>
                                        <div className="text-[9px] font-black text-white/30 font-mono tracking-widest italic uppercase">
                                            {(() => {
                                                const d = new Date(item.created_at);
                                                const hh = d.getHours().toString().padStart(2, '0');
                                                const mm = d.getMinutes().toString().padStart(2, '0');
                                                const day = d.getDate().toString().padStart(2, '0');
                                                const mo = (d.getMonth() + 1).toString().padStart(2, '0');
                                                return `${hh}:${mm} // ${day}.${mo}`;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Pagination Overhaul - Minimal & Clinical */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center gap-4 py-3 px-5 border-t border-white/5 bg-black/40 mt-auto">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="px-2 py-1 hover:bg-[var(--color-flare)]/10 disabled:opacity-10 rounded-[1px] text-[8px] font-black text-[var(--color-silver)] border border-white/10 hover:border-[var(--color-flare)]/30 transition-all uppercase tracking-widest italic"
                        >
                            {t('page_head')}
                        </button>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-2 py-1 hover:bg-[var(--color-flare)]/10 disabled:opacity-10 rounded-[1px] text-[8px] font-black text-[var(--color-silver)] border border-white/10 hover:border-[var(--color-flare)]/30 transition-all uppercase tracking-widest italic"
                        >
                            {t('page_prev')}
                        </button>
                    </div>

                    <div className="text-[8px] font-black text-[var(--color-silver)] uppercase tracking-[0.2em] italic flex items-center gap-2">
                        <span className="opacity-20">{t('sector_prefix')}</span>
                        <span className="text-[var(--color-flare)]">{page}</span>
                        <span className="opacity-20">/ {totalPages}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-2 py-1 hover:bg-[var(--color-flare)]/10 disabled:opacity-10 rounded-[1px] text-[8px] font-black text-[var(--color-silver)] border border-white/10 hover:border-[var(--color-flare)]/30 transition-all uppercase tracking-widest italic"
                        >
                            {t('page_next')}
                        </button>
                        <button
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                            className="px-2 py-1 hover:bg-[var(--color-flare)]/10 disabled:opacity-10 rounded-[1px] text-[8px] font-black text-[var(--color-silver)] border border-white/10 hover:border-[var(--color-flare)]/30 transition-all uppercase tracking-widest italic"
                        >
                            {t('page_tail')}
                        </button>
                    </div>
                </div>
            )}

            {sharingItem && (
                <PnLShareModal
                    trade={{
                        symbol: sharingItem.symbol,
                        signal: sharingItem.signal,
                        price_at_signal: sharingItem.price_at_signal,
                        status: sharingItem.status as 'SUCCESS' | 'FAILED',
                        target_price: sharingItem.target_price,
                        stop_loss: sharingItem.stop_loss,
                        timeframe: sharingItem.timeframe,
                        pnl_reason: sharingItem.pnl_reason,
                        strategy_name: sharingItem.strategy_name
                    } as any}
                    onClose={() => setSharingItem(null)}
                />
            )}
        </div>
    );
};
