import { useState, useEffect, useCallback } from 'react';

interface TrendBias {
    timeframe: string;
    label: string;
    bias: 'bullish' | 'bearish' | 'neutral';
}

export function useEMATrendBias(symbol: string) {
    const [trends, setTrends] = useState<TrendBias[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTrends = useCallback(async () => {
        if (!symbol || symbol.length < 3) return;

        const normalizedSymbol = symbol.toUpperCase().replace('/', '');
        setLoading(true);

        try {
            const tfConfigs = [
                { interval: '1d', label: 'Daily' },
                { interval: '1w', label: 'Weekly' },
                { interval: '1M', label: 'Monthly' }
            ];

            const results: TrendBias[] = [];

            for (const tf of tfConfigs) {
                try {
                    const response = await fetch(
                        `https://fapi.binance.com/fapi/v1/klines?symbol=${normalizedSymbol}&interval=${tf.interval}&limit=50`
                    );

                    if (!response.ok) continue;

                    const data = await response.json();

                    if (Array.isArray(data) && data.length >= 20) {
                        const closes = data.map((k: any) => parseFloat(k[4]));
                        const currentPrice = closes[closes.length - 1];

                        // Using SMA 20 as a robust trend indicator for high timeframes
                        const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;

                        let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
                        const diffPercent = ((currentPrice - ma20) / ma20) * 100;

                        if (diffPercent > 0.5) bias = 'bullish';
                        else if (diffPercent < -0.5) bias = 'bearish';

                        results.push({
                            timeframe: tf.interval.toUpperCase(),
                            label: tf.label,
                            bias
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to fetch trend for ${tf.interval}`, e);
                }
            }

            if (results.length > 0) {
                setTrends(results);
            }
        } catch (e) {
            console.error('useEMATrendBias error:', e);
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchTrends();
        // Higher timeframes don't need frequent updates
        const interval = setInterval(fetchTrends, 600000); // 10 minutes
        return () => clearInterval(interval);
    }, [fetchTrends]);

    return { trends, loading };
}
