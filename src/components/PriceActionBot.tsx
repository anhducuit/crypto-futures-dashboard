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
        status: 'PENDING',
        minConfluence: 40
    });

    const fetchSignals = useCallback(async () => {
        try {
            let query = supabase
                .from('price_action_signals')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (filter.status !== 'ALL') {
                query = query.eq('status', filter.status);
            }

            if (filter.minConfluence > 0) {
                query = query.gte('confluence_score', filter.minConfluence);
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
        const interval = setInterval(fetchSignals, 10000); // Poll every 10s
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

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">🎯 Price Action Bot</h3>
                </div>
                <div className="card-body">
                    <div className="text-center py-8">Loading signals...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">🎯 Price Action Bot</h3>
                <div className="flex gap-2">
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="ACTIVE">Active</option>
                        <option value="WIN">Win</option>
                        <option value="LOSS">Loss</option>
                    </select>

                    <select
                        value={filter.minConfluence}
                        onChange={(e) => setFilter({ ...filter, minConfluence: parseInt(e.target.value) })}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    >
                        <option value="0">All Scores</option>
                        <option value="40">Score ≥ 40</option>
                        <option value="60">Score ≥ 60</option>
                        <option value="80">Score ≥ 80</option>
                    </select>
                </div>
            </div>

            <div className="card-body">
                {signals.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No signals found. Bot is scanning...
                    </div>
                ) : (
                    <div className="space-y-3">
                        {signals.map((signal) => (
                            <div
                                key={signal.id}
                                className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{getSignalIcon(signal.signal_type)}</span>
                                        <div>
                                            <div className="font-bold text-lg">
                                                {signal.symbol} <span className="text-sm text-gray-400">{signal.timeframe}</span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {signal.pattern_type.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`text-lg font-bold ${getConfluenceColor(signal.confluence_score)}`}>
                                            {signal.confluence_score}% Confluence
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {signal.confluence_factors.length} factors
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div>
                                        <div className="text-xs text-gray-400">Entry</div>
                                        <div className="font-mono">${signal.entry_price.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Target</div>
                                        <div className="font-mono text-green-400">${signal.target_price.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Stop Loss</div>
                                        <div className="font-mono text-red-400">${signal.stop_loss.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-2">
                                    <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">
                                        {signal.market_trend}
                                    </span>
                                    {signal.sd_zone_type && (
                                        <span className={`px-2 py-1 text-xs rounded ${signal.sd_zone_type === 'DEMAND'
                                                ? 'bg-green-900/30 text-green-400'
                                                : 'bg-red-900/30 text-red-400'
                                            }`}>
                                            {signal.sd_zone_type} Zone ({signal.sd_zone_strength})
                                        </span>
                                    )}
                                    {signal.volume_confirmed && (
                                        <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded">
                                            Vol: {signal.volume_ratio.toFixed(2)}x
                                        </span>
                                    )}
                                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                                        R:R {signal.risk_reward_ratio.toFixed(1)}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-500">
                                    {new Date(signal.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
