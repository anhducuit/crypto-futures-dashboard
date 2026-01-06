import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface KlineData {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
}

interface MAAnalysis {
    timeframes: {
        timeframe: string;
        label: string;
        ma: number;
        currentPrice: number;
        trend: 'bullish' | 'bearish' | 'neutral';
        swingHigh: number;
        swingLow: number;
        rsi: number;
        avgVolume: number;
        currentVolume: number;
        volumeRatio: number; // current / average
        priceGap: number;    // % distance from MA
    }[];
    overallBias: 'long' | 'short' | 'neutral';
    confidence: number;
}

// Calculate RSI (Relative Strength Index)
function calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
        const difference = closes[i] - closes[i - 1];
        if (difference >= 0) {
            gains += difference;
        } else {
            losses -= difference;
        }
    }

    if (losses === 0) return 100;

    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

// Calculate Simple Moving Average
function calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

// Find Swing High/Low from candles
function findSwingPoints(klines: KlineData[]): { swingHigh: number; swingLow: number } {
    if (klines.length === 0) return { swingHigh: 0, swingLow: 0 };

    const highs = klines.map(k => k.high);
    const lows = klines.map(k => k.low);

    return {
        swingHigh: Math.max(...highs),
        swingLow: Math.min(...lows)
    };
}

const timeframeConfigs = [
    { interval: '1m', label: '1 Phút', limit: 50 },
    { interval: '15m', label: '15 Phút', limit: 50 },
    { interval: '1h', label: '1 Giờ', limit: 50 },
    { interval: '4h', label: '4 Giờ', limit: 50 },
];

export function useBinanceKlines(symbol: string) {
    const [data, setData] = useState<MAAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track current symbol to prevent stale data updates
    const currentSymbolRef = useRef(symbol);
    const lastSavedRef = useRef<Record<string, number>>({}); // timeframe -> timestamp
    const abortControllerRef = useRef<AbortController | null>(null);

    // Update ref when symbol changes
    useEffect(() => {
        currentSymbolRef.current = symbol;
        lastSavedRef.current = {}; // Reset history tracking when symbol changes
    }, [symbol]);

    // Save signal to Supabase
    const saveSignal = async (
        tfLabel: string,
        signal: 'LONG' | 'SHORT',
        price: number,
        rsi: number,
        volRatio: number,
        priceGap: number
    ) => {
        try {
            const key = `${symbol}_${tfLabel}`;
            const now = Date.now();

            // To prevent spamMING, only save once per 1 hour for each timeframe and signal type
            // (or if signal changed significantLY, but for now let's use time-based cooldown)
            if (lastSavedRef.current[key] && now - lastSavedRef.current[key] < 3600000) {
                return;
            }

            // Calculate simple target and stoploss (0.5% / 0.3%)
            const target_price = signal === 'LONG' ? price * 1.005 : price * 0.995;
            const stop_loss = signal === 'LONG' ? price * 0.997 : price * 1.003;

            const { error: saveError } = await supabase
                .from('trading_history')
                .insert([{
                    symbol: symbol.toUpperCase(),
                    timeframe: tfLabel,
                    signal,
                    price_at_signal: price,
                    rsi,
                    volume_ratio: volRatio,
                    price_gap: priceGap,
                    status: 'PENDING',
                    target_price,
                    stop_loss
                }]);

            if (saveError) throw saveError;

            lastSavedRef.current[key] = now;
            console.log(`Saved signal for ${tfLabel}: ${signal}`);
        } catch (e) {
            console.error('Failed to auto-save signal:', e);
        }
    };

    const fetchKlines = useCallback(async (targetSymbol: string) => {
        if (!targetSymbol || targetSymbol.length < 3) return;

        // Abort previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const normalizedSymbol = targetSymbol.toUpperCase().replace('/', '');
            const results: MAAnalysis['timeframes'] = [];
            let bullishCount = 0;
            let bearishCount = 0;

            for (const tf of timeframeConfigs) {
                // Check if symbol changed during fetch
                if (currentSymbolRef.current !== targetSymbol) {
                    console.log(`Symbol changed during fetch, aborting: ${targetSymbol}`);
                    return;
                }

                try {
                    const response = await fetch(
                        `https://api.binance.com/api/v3/klines?symbol=${normalizedSymbol}&interval=${tf.interval}&limit=${tf.limit}`,
                        { signal: abortControllerRef.current?.signal }
                    );

                    if (!response.ok) {
                        throw new Error(`API Error: ${response.status}`);
                    }

                    const rawData = await response.json();

                    if (!Array.isArray(rawData) || rawData.length === 0) {
                        console.warn(`No data for ${normalizedSymbol} ${tf.interval}`);
                        continue;
                    }

                    const klines: KlineData[] = rawData.map((k: any[]) => ({
                        openTime: k[0],
                        open: parseFloat(k[1]),
                        high: parseFloat(k[2]),
                        low: parseFloat(k[3]),
                        close: parseFloat(k[4]),
                        volume: parseFloat(k[5]),
                        closeTime: k[6]
                    }));

                    const closes = klines.map(k => k.close);
                    const volumes = klines.map(k => k.volume);
                    const ma20 = calculateSMA(closes, 20);
                    const currentPrice = closes[closes.length - 1];
                    const currentVolume = volumes[volumes.length - 1];
                    const avgVolume = calculateSMA(volumes, 20);
                    const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
                    const rsi = calculateRSI(closes, 14);
                    const priceGap = ((currentPrice - ma20) / ma20) * 100;

                    const { swingHigh, swingLow } = findSwingPoints(klines);

                    // Determine trend based on price vs MA
                    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
                    const priceVsMa = ((currentPrice - ma20) / ma20) * 100;

                    if (priceVsMa > 0.5) {
                        trend = 'bullish';
                        bullishCount++;
                    } else if (priceVsMa < -0.5) {
                        trend = 'bearish';
                        bearishCount++;
                    }

                    results.push({
                        timeframe: tf.interval,
                        label: tf.label,
                        ma: ma20,
                        currentPrice,
                        trend,
                        swingHigh,
                        swingLow,
                        rsi,
                        avgVolume,
                        currentVolume,
                        volumeRatio,
                        priceGap
                    });

                    // Auto-save logic: Check for clear signals
                    // Threshold: RSI extremes + MA confirmation + Vol boost OR simple Trend confirmation
                    if (trend !== 'neutral') {
                        const signalType = trend === 'bullish' ? 'LONG' : 'SHORT';
                        // Additional filter: only save if it's a "quality" signal (e.g. not just hovering near MA)
                        if (Math.abs(priceGap) > 0.8) {
                            saveSignal(tf.label, signalType, currentPrice, rsi, volumeRatio, priceGap);
                        }
                    }
                } catch (e: any) {
                    if (e.name === 'AbortError') {
                        console.log(`Fetch aborted for ${normalizedSymbol} ${tf.interval}`);
                        return;
                    }
                    console.error(`Error fetching ${tf.interval}:`, e);
                }
            }

            // Final check: only update state if symbol hasn't changed
            if (currentSymbolRef.current !== targetSymbol) {
                console.log(`Symbol changed after fetch, discarding: ${targetSymbol}`);
                return;
            }

            if (results.length === 0) {
                setError(`Không tìm thấy dữ liệu cho ${normalizedSymbol}`);
                setData(null);
                return;
            }

            // Calculate overall bias
            let overallBias: 'long' | 'short' | 'neutral' = 'neutral';
            const total = bullishCount + bearishCount;
            const confidence = total > 0 ? Math.max(bullishCount, bearishCount) / timeframeConfigs.length * 100 : 0;

            if (bullishCount > bearishCount && bullishCount >= 2) {
                overallBias = 'long';
            } else if (bearishCount > bullishCount && bearishCount >= 2) {
                overallBias = 'short';
            }

            setData({
                timeframes: results,
                overallBias,
                confidence
            });
            setError(null);
        } catch (e: any) {
            if (e.name === 'AbortError') {
                return;
            }
            console.error('fetchKlines error:', e);
            if (currentSymbolRef.current === targetSymbol) {
                setError('Không thể lấy dữ liệu từ Binance');
            }
        } finally {
            if (currentSymbolRef.current === targetSymbol) {
                setLoading(false);
            }
        }
    }, []);

    // Fetch when symbol changes
    useEffect(() => {
        // Clear old data immediately when symbol changes
        setData(null);
        setError(null);

        if (symbol && symbol.length >= 3) {
            fetchKlines(symbol);
        }

        // Cleanup on unmount or symbol change
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [symbol, fetchKlines]);

    // Periodic refresh
    useEffect(() => {
        if (!symbol || symbol.length < 3) return;

        const interval = setInterval(() => {
            if (currentSymbolRef.current === symbol) {
                fetchKlines(symbol);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [symbol, fetchKlines]);

    const refetch = useCallback(() => {
        fetchKlines(currentSymbolRef.current);
    }, [fetchKlines]);

    return { data, loading, error, refetch };
}
