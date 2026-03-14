import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
    symbol: string;
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    tfBreakdown?: Record<string, { total: number, wins: number, losses: number }>;
}

export const useTradeAnalytics = (timeFilter: '24h' | '7d' | '30d' | 'all') => {
    const [stats, setStats] = useState<AnalyticsData[]>([]);
    const [bestHours, setBestHours] = useState<Record<string, { wins: number, losses: number }>>({});
    const [strategyStats, setStrategyStats] = useState<Record<string, { wins: number, losses: number }>>({});
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [botOnline, setBotOnline] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const now = new Date();

            // Fetch Heartbeat
            const { data: heartbeat } = await supabase.from('bot_settings').select('value').eq('key', 'last_scan_at').single();
            if (heartbeat) {
                setLastScan(heartbeat.value);
                const diff = (new Date().getTime() - new Date(heartbeat.value).getTime()) / 1000;
                setBotOnline(diff < 300);
            }

            let allData: any[] = [];
            let page = 0;
            const pageSize = 10000;
            let hasMore = true;

            while (hasMore && allData.length < 100000) {
                let query = supabase
                    .from('trading_history')
                    .select('id, created_at, symbol, signal, status, pnl_reason, strategy_name, timeframe')
                    .order('created_at', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (timeFilter !== 'all') {
                    let dateLimit = new Date();
                    if (timeFilter === '24h') dateLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    if (timeFilter === '7d') dateLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (timeFilter === '30d') dateLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    query = query.gte('created_at', dateLimit.toISOString());
                }

                const { data, error } = await query;
                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    if (data.length < pageSize) hasMore = false;
                    else page++;
                } else {
                    hasMore = false;
                }
            }

            const data = allData;

            if (data) {
                const symbolMap: Record<string, { wins: number, losses: number, tfMap: any }> = {};
                const baseSymbols = ['XAUUSDT', 'XAGUSDT', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'NEARUSDT', 'TIAUSDT'];
                baseSymbols.forEach(s => {
                    symbolMap[s] = { wins: 0, losses: 0, tfMap: {} };
                });

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

                const strategyMap: Record<string, { wins: number, losses: number }> = {
                    '💎 SÁT THỦ BẮT ĐỈNH ĐÁY': { wins: 0, losses: 0 },
                    '⚔️ CHIẾN THẦN ĐU TREND': { wins: 0, losses: 0 },
                    '🪤 BẪY GIÁ - SĂN THANH KHOẢN': { wins: 0, losses: 0 },
                    '💣 QUẢ BOM ĐỘNG LƯỢNG': { wins: 0, losses: 0 },
                    '🔔 CHỈ BÁO THOÁT CHANDELIER': { wins: 0, losses: 0 },
                    '🏦 ICT KILLZONES': { wins: 0, losses: 0 }
                };

                data.forEach(t => {
                    const strategyName = t.strategy_name;
                    if (strategyName) {
                        for (const [key, value] of Object.entries(strategyMap)) {
                            if (strategyName.includes(key)) {
                                if (t.status === 'SUCCESS') value.wins++;
                                else if (t.status === 'FAILED') value.losses++;
                                break;
                            }
                        }
                    }
                });
                setStrategyStats(strategyMap);

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

    return { stats, bestHours, strategyStats, lastScan, botOnline, loading, refresh: fetchData };
};
