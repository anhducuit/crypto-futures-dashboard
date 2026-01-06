import { useEffect, useRef } from 'react';
import { saveSignalToSupabase } from '../utils/supabaseUtils';

interface MAAnalysis {
    timeframes: {
        timeframe: string;
        label: string;
        trend: 'bullish' | 'bearish' | 'neutral';
        rsi: number;
        volumeRatio: number;
        priceGap: number;
    }[];
    overallBias: 'long' | 'short' | 'neutral';
    confidence: number;
}

export function useSignalGenerator(
    symbol: string,
    maAnalysis: MAAnalysis | null,
    currentPrice: number
) {
    const lastCheckRef = useRef<number>(0);
    const lastSignalRef = useRef<Record<string, number>>({});

    useEffect(() => {
        if (!maAnalysis || !symbol || !currentPrice) return;

        const checkSignals = async () => {
            const now = Date.now();
            // Throttle: Check only once every 5 seconds
            if (now - lastCheckRef.current < 5000) return;
            lastCheckRef.current = now;

            // 1. Separate timeframes
            const tf1m = maAnalysis.timeframes.find(t => t.timeframe === '1m');
            const tf15m = maAnalysis.timeframes.find(t => t.timeframe === '15m');
            const tf1h = maAnalysis.timeframes.find(t => t.timeframe === '1h');
            const tf4h = maAnalysis.timeframes.find(t => t.timeframe === '4h');

            // 2. Trend Analysis (1h & 4h)
            const trendScore = (tf1h?.trend === 'bullish' ? 1 : tf1h?.trend === 'bearish' ? -1 : 0) +
                (tf4h?.trend === 'bullish' ? 1 : tf4h?.trend === 'bearish' ? -1 : 0);
            const majorTrend = trendScore >= 1 ? 'long' : trendScore <= -1 ? 'short' : 'neutral';

            // 3. Momentum Analysis (1m & 15m)
            const momentumScore = (tf1m?.trend === 'bullish' ? 1 : tf1m?.trend === 'bearish' ? -1 : 0) +
                (tf15m?.trend === 'bullish' ? 1 : tf15m?.trend === 'bearish' ? -1 : 0);
            const momentum = momentumScore >= 1 ? 'bullish' : momentumScore <= -1 ? 'bearish' : 'neutral';

            // 4. Filters
            const isOverbought = (tf15m?.rsi || 50) > 75;
            const isOversold = (tf15m?.rsi || 50) < 25;
            const isWeakVolume = (tf15m?.volumeRatio || 1) < 0.6;

            let signal: 'LONG' | 'SHORT' | null = null;

            // 5. Logic Matching (Same as TradingRecommendation.tsx)
            if (majorTrend === 'long' && momentum === 'bullish') {
                if (!isOverbought && !isWeakVolume) {
                    signal = 'LONG';
                }
            } else if (majorTrend === 'short' && momentum === 'bearish') {
                if (!isOversold && !isWeakVolume) {
                    signal = 'SHORT';
                }
            }

            // 6. Save Signal
            if (signal) {
                // We use 1m as the base timeframe for these scalping signals
                await saveSignalToSupabase(
                    symbol,
                    '1m',
                    signal,
                    currentPrice,
                    tf15m?.rsi || 50,
                    tf15m?.volumeRatio || 1,
                    tf15m?.priceGap || 0,
                    lastSignalRef
                );
            }
        };

        checkSignals();
    }, [maAnalysis, symbol, currentPrice]);
}
