import { useEffect, useRef } from 'react';
import { saveSignalToSupabase } from '../utils/supabaseUtils';
import type { MAAnalysis } from './useBinanceKlines'; // Import shared interface

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

            // 2. Trend Analysis (1H: MA20 vs MA50)
            const majorTrend = tf1h?.trend === 'bullish' ? 'long' : tf1h?.trend === 'bearish' ? 'short' : 'neutral';

            // 3. Signal Trigger (15M: MA12 Cross MA26)
            let signalTrigger = 'neutral';
            if (tf15m?.cross === 'bullish_cross') signalTrigger = 'bullish';
            else if (tf15m?.cross === 'bearish_cross') signalTrigger = 'bearish';

            // 4. Filters
            const isOverbought = (tf15m?.rsi || 50) > 75;
            const isOversold = (tf15m?.rsi || 50) < 25;
            const isWeakVolume = (tf15m?.volumeRatio || 1) < 0.6;

            let signal: 'LONG' | 'SHORT' | null = null;
            let finalTf = '15m';

            // 5. Logic Matching (Strict Strategy)
            if (majorTrend === 'long' && signalTrigger === 'bullish') {
                if (!isOverbought && !isWeakVolume) {
                    signal = 'LONG';
                }
            } else if (majorTrend === 'short' && signalTrigger === 'bearish') {
                if (!isOversold && !isWeakVolume) {
                    signal = 'SHORT';
                }
            }

            // Fallback: 1m Scalp if no 15m signal (Silent Mode on Server, but we valid here)
            // We only scalp in direction of Major Trend (1H)
            if (!signal && tf1m) {
                if (majorTrend === 'long' && tf1m.trend === 'bullish' && (tf1m.rsi < 70)) {
                    signal = 'LONG';
                    finalTf = '1m';
                } else if (majorTrend === 'short' && tf1m.trend === 'bearish' && (tf1m.rsi > 30)) {
                    signal = 'SHORT';
                    finalTf = '1m';
                }
            }

            // 6. Save Signal
            if (signal) {
                // We pass finalTf to ensure correct labeling
                await saveSignalToSupabase(
                    symbol,
                    finalTf,
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
