import { useState, useEffect, useCallback, useRef } from 'react';

interface KlineData {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
}

export interface MAAnalysis {
    timeframes: {
        timeframe: string;
        label: string;
        ma20: number;
        ma50?: number; // For 1H
        ma12?: number; // For 15m
        ma26?: number; // For 15m
        cross?: 'bullish_cross' | 'bearish_cross' | 'none'; // For 15m

        currentPrice: number;
        trend: 'bullish' | 'bearish' | 'neutral'; // 1H: Based on MA20/50. Others: MA20
        swingHigh: number;
        swingLow: number;
        rsi: number;
        avgVolume: number;
        currentVolume: number;
        volumeRatio: number;
        priceGap: number;
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

function calculateSMAArray(data: number[], period: number): number[] {
    if (data.length < period) return [];
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result;
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
    const abortControllerRef = useRef<AbortController | null>(null);

    // Update ref when symbol changes
    useEffect(() => {
        currentSymbolRef.current = symbol;
    }, [symbol]);

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

            // Logic counters (kept for compatibility, though we rely on specific strategy now)
            let bullishCount = 0;
            let bearishCount = 0;

            for (const tf of timeframeConfigs) {
                // Check if symbol changed during fetch
                if (currentSymbolRef.current !== targetSymbol) {
                    return;
                }

                try {
                    const response = await fetch(
                        `https://fapi.binance.com/fapi/v1/klines?symbol=${normalizedSymbol}&interval=${tf.interval}&limit=${tf.limit}`,
                        { signal: abortControllerRef.current?.signal }
                    );

                    if (!response.ok) {
                        throw new Error(`API Error: ${response.status}`);
                    }

                    const rawData = await response.json();

                    if (!Array.isArray(rawData) || rawData.length === 0) {
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

                    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
                    let ma50, ma12, ma26, cross;

                    // 1. Trend Determination
                    if (tf.interval === '1h') {
                        ma50 = calculateSMA(closes, 50);
                        if (ma20 > ma50) trend = 'bullish';
                        else if (ma20 < ma50) trend = 'bearish';
                    } else if (tf.interval === '15m') {
                        // 15m Cross Logic
                        const ma12Array = calculateSMAArray(closes, 12);
                        const ma26Array = calculateSMAArray(closes, 26);

                        ma12 = ma12Array[ma12Array.length - 1];
                        ma26 = ma26Array[ma26Array.length - 1];

                        const ma12_prev = ma12Array[ma12Array.length - 2];
                        const ma26_prev = ma26Array[ma26Array.length - 2];

                        cross = 'none';
                        if (ma12_prev <= ma26_prev && ma12 > ma26) cross = 'bullish_cross';
                        else if (ma12_prev >= ma26_prev && ma12 < ma26) cross = 'bearish_cross';

                        // Default trend for 15m (fallback)
                        trend = ma12 > ma26 ? 'bullish' : 'bearish';
                    } else {
                        // Default MA20 Trend for 1m, 4h
                        const threshold = tf.interval === '1m' ? 0.05 : 0.5;
                        if (priceGap > threshold) trend = 'bullish';
                        else if (priceGap < -threshold) trend = 'bearish';
                    }

                    if (trend === 'bullish') bullishCount++;
                    if (trend === 'bearish') bearishCount++;

                    results.push({
                        timeframe: tf.interval,
                        label: tf.label,
                        ma20, ma50, ma12, ma26, cross: cross as any,
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

                } catch (e: any) {
                    if (e.name !== 'AbortError') console.error(`Error fetching ${tf.interval}:`, e);
                }
            }

            if (results.length === 0) {
                setError(`Không tìm thấy dữ liệu cho ${normalizedSymbol}`);
                setData(null);
                return;
            }

            // Calculate overall bias (Simplified confidence)
            let overallBias: 'long' | 'short' | 'neutral' = 'neutral';

            // New Strategy Bias (1H + 15M)
            const h1 = results.find(r => r.timeframe === '1h');
            const m15 = results.find(r => r.timeframe === '15m');

            if (h1 && m15) {
                if (h1.trend === 'bullish' && (m15.cross === 'bullish_cross' || m15.trend === 'bullish')) overallBias = 'long';
                else if (h1.trend === 'bearish' && (m15.cross === 'bearish_cross' || m15.trend === 'bearish')) overallBias = 'short';
            }

            setData({
                timeframes: results,
                overallBias,
                confidence: 80 // Hardcoded for now as strategy is specific
            });
            setError(null);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
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
        setData(null);
        setError(null);
        if (symbol && symbol.length >= 3) {
            fetchKlines(symbol);
        }
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, [symbol, fetchKlines]);

    // Periodic refresh
    useEffect(() => {
        if (!symbol || symbol.length < 3) return;
        const interval = setInterval(() => {
            if (currentSymbolRef.current === symbol) fetchKlines(symbol);
        }, 15000); // Increased refresh rate for 1m responsiveness
        return () => clearInterval(interval);
    }, [symbol, fetchKlines]);

    const refetch = useCallback(() => {
        fetchKlines(currentSymbolRef.current);
    }, [fetchKlines]);

    return { data, loading, error, refetch };
}
