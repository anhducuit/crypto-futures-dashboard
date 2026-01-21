import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface PriceActionSignal {
    id: string;
    created_at: string;
    symbol: string;
    timeframe: string;
    signal_type: 'LONG' | 'SHORT';
    pattern_category: string;
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
    volume_confirmed: boolean;
    volume_ratio: number;
    status: string;
}

export const PriceActionBot: React.FC = () => {
    const [signals, setSignals] = useState<PriceActionSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: 'ALL',
        minConfluence: 0,
        symbol: 'ALL',
        timeframe: 'ALL'
    });

    const fetchSignals = useCallback(async () => {
        try {
            let query = supabase
                .from('price_action_signals')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (filter.status !== 'ALL') {
                query = query.eq('status', filter.status);
            }

            if (filter.minConfluence > 0) {
                query = query.gte('confluence_score', filter.minConfluence);
            }

            if (filter.symbol !== 'ALL') {
                query = query.eq('symbol', filter.symbol);
            }

            if (filter.timeframe !== 'ALL') {
                query = query.eq('timeframe', filter.timeframe);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSignals(data || []);
        } catch (error) {
            console.error('Error fetching PA signals:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchSignals();
        const interval = setInterval(fetchSignals, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchSignals]);

    const getSignalIcon = (type: string) => {
        return type === 'LONG' ? '🟢' : '🔴';
    };

    const getConfluenceColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-orange-400';
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            'PENDING': 'bg-gray-700 text-gray-300',
            'ACTIVE': 'bg-blue-700 text-blue-300',
            'WIN': 'bg-green-700 text-green-300',
            'LOSS': 'bg-red-700 text-red-300'
        };
        return badges[status as keyof typeof badges] || badges.PENDING;
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">🎯 Bot Price Action</h3>
                </div>
                <div className="card-body">
                    <div className="text-center py-4 text-sm">Đang tải...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">🎯 Bot Price Action</h3>
                <div className="text-xs text-gray-400">
                    {signals.length} tín hiệu
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-b border-gray-700 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={filter.symbol}
                        onChange={(e) => setFilter({ ...filter, symbol: e.target.value })}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs"
                    >
                        <option value="ALL">Tất cả cặp</option>
                        <option value="BTCUSDT">BTC</option>
                        <option value="ETHUSDT">ETH</option>
                        <option value="SOLUSDT">SOL</option>
                        <option value="BNBUSDT">BNB</option>
                        <option value="XRPUSDT">XRP</option>
                    </select>

                    <select
                        value={filter.timeframe}
                        onChange={(e) => setFilter({ ...filter, timeframe: e.target.value })}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs"
                    >
                        <option value="ALL">Tất cả khung</option>
                        <option value="1m">1 phút</option>
                        <option value="15m">15 phút</option>
                        <option value="1h">1 giờ</option>
                        <option value="4h">4 giờ</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="ACTIVE">Đang chạy</option>
                        <option value="WIN">Thắng</option>
                        <option value="LOSS">Thua</option>
                    </select>

                    <select
                        value={filter.minConfluence}
                        onChange={(e) => setFilter({ ...filter, minConfluence: parseInt(e.target.value) })}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs"
                    >
                        <option value="0">Tất cả điểm</option>
                        <option value="40">Điểm ≥ 40</option>
                        <option value="60">Điểm ≥ 60</option>
                        <option value="80">Điểm ≥ 80</option>
                    </select>
                </div>
            </div>

            <div className="card-body max-h-[600px] overflow-y-auto">
                {signals.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                        Không tìm thấy tín hiệu. Bot đang quét thị trường...
                    </div>
                ) : (
                    <div className="space-y-2">
                        {signals.map((signal) => (
                            <div
                                key={signal.id}
                                className="p-3 bg-gray-800 border border-gray-700 rounded hover:border-gray-600 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getSignalIcon(signal.signal_type)}</span>
                                        <div>
                                            <div className="font-bold text-sm">
                                                {signal.symbol.replace('USDT', '')}
                                                <span className="text-xs text-gray-400 ml-1">{signal.timeframe}</span>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {signal.pattern_type.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${getConfluenceColor(signal.confluence_score)}`}>
                                            {signal.confluence_score}%
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {signal.confluence_factors.length} yếu tố
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                                    <div>
                                        <div className="text-gray-400">Vào</div>
                                        <div className="font-mono">${signal.entry_price.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Mục tiêu</div>
                                        <div className="font-mono text-green-400">${signal.target_price.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Cắt lỗ</div>
                                        <div className="font-mono text-red-400">${signal.stop_loss.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1 mb-2">
                                    <span className={`px-2 py-0.5 text-xs rounded ${getStatusBadge(signal.status)}`}>
                                        {signal.status === 'PENDING' ? 'Chờ' : signal.status}
                                    </span>
                                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded">
                                        {signal.market_trend}
                                    </span>
                                    {signal.sd_zone_type && (
                                        <span className={`px-2 py-0.5 text-xs rounded ${signal.sd_zone_type === 'DEMAND'
                                                ? 'bg-green-900/30 text-green-400'
                                                : 'bg-red-900/30 text-red-400'
                                            }`}>
                                            {signal.sd_zone_type} ({signal.sd_zone_strength})
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                                        R:R {signal.risk_reward_ratio.toFixed(1)}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-500">
                                    {new Date(signal.created_at).toLocaleString('vi-VN')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
