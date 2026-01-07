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
        ma50?: number; // For 1H, 4H
        ma200?: number; // For 4H
        ma12?: number; // For 15m
        ma26?: number; // For 15m
        cross?: 'bullish_cross' | 'bearish_cross' | 'golden_cross' | 'death_cross' | 'none';
        currentPrice: number;
        trend: 'bullish' | 'bearish' | 'neutral';
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

// Calculate RSI
function calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

// Calculate SMA
function calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    return data.slice(-period).reduce((a, b) => a + b, 0) / period;
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
    { interval: '4h', label: '4 Giờ', limit: 200 },
];

export function useBinanceKlines(symbol: string) {
    const [data, setData] = useState<MAAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentSymbolRef = useRef(symbol);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        currentSymbolRef.current = symbol;
    }, [symbol]);

    const fetchKlines = useCallback(async (targetSymbol: string) => {
        if (!targetSymbol || targetSymbol.length < 3) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const normalizedSymbol = targetSymbol.toUpperCase().replace('/', '');
            const results: MAAnalysis['timeframes'] = [];

            for (const tf of timeframeConfigs) {
                if (currentSymbolRef.current !== targetSymbol) return;

                try {
                    const response = await fetch(
                        `https://fapi.binance.com/fapi/v1/klines?symbol=${normalizedSymbol}&interval=${tf.interval}&limit=${tf.limit}`,
                        { signal: abortControllerRef.current?.signal }
                    );

                    if (!response.ok) throw new Error(`API Error: ${response.status}`);
                    const rawData = await response.json();
                    if (!Array.isArray(rawData) || rawData.length === 0) continue;

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
                    let ma50, ma200, ma12, ma26, cross;

                    // 4H Analysis (MA50/MA200)
                    if (tf.interval === '4h') {
                        const ma50Arr = calculateSMAArray(closes, 50);
                        const ma200Arr = calculateSMAArray(closes, 200);

                        ma50 = ma50Arr[ma50Arr.length - 1];
                        ma200 = ma200Arr[ma200Arr.length - 1];

                        const ma50_prev = ma50Arr[ma50Arr.length - 2];
                        const ma200_prev = ma200Arr[ma200Arr.length - 2];

                        cross = 'none';
                        if (ma50_prev <= ma200_prev && ma50 > ma200) cross = 'golden_cross';
                        else if (ma50_prev >= ma200_prev && ma50 < ma200) cross = 'death_cross';

                        if (ma50 > ma200) trend = 'bullish';
                        else if (ma50 < ma200) trend = 'bearish';

                    } else if (tf.interval === '1h') {
                        ma50 = calculateSMA(closes, 50);
                        if (ma20 > ma50) trend = 'bullish';
                        else if (ma20 < ma50) trend = 'bearish';
                    } else if (tf.interval === '15m') {
                        const ma12Array = calculateSMAArray(closes, 12);
                        const ma26Array = calculateSMAArray(closes, 26);
                        ma12 = ma12Array[ma12Array.length - 1];
                        ma26 = ma26Array[ma26Array.length - 1];
                        const ma12_prev = ma12Array[ma12Array.length - 2];
                        const ma26_prev = ma26Array[ma26Array.length - 2];

                        cross = 'none';
                        if (ma12_prev <= ma26_prev && ma12 > ma26) cross = 'bullish_cross';
                        else if (ma12_prev >= ma26_prev && ma12 < ma26) cross = 'bearish_cross';

                        trend = ma12 > ma26 ? 'bullish' : 'bearish';
                    } else {
                        const threshold = tf.interval === '1m' ? 0.05 : 0.5;
                        if (priceGap > threshold) trend = 'bullish';
                        else if (priceGap < -threshold) trend = 'bearish';
                    }

                    results.push({
                        timeframe: tf.interval,
                        label: tf.label,
                        ma20, ma50, ma200, ma12, ma26, cross: cross as any,
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

            let overallBias: 'long' | 'short' | 'neutral' = 'neutral';
            const h1 = results.find(r => r.timeframe === '1h');
            const m15 = results.find(r => r.timeframe === '15m');

            if (h1 && m15) {
                if (h1.trend === 'bullish' && (m15.cross === 'bullish_cross' || m15.trend === 'bullish')) overallBias = 'long';
                else if (h1.trend === 'bearish' && (m15.cross === 'bearish_cross' || m15.trend === 'bearish')) overallBias = 'short';
            }

            setData({
                timeframes: results,
                overallBias,
                confidence: 80
            });
            setError(null);
        } catch (e: any) {
            if (e.name !== 'AbortError') setError('Không thể lấy dữ liệu từ Binance');
        } finally {
            if (currentSymbolRef.current === targetSymbol) setLoading(false);
        }
    }, []);

    useEffect(() => {
        setData(null);
        setError(null);
        if (symbol && symbol.length >= 3) fetchKlines(symbol);
        return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
    }, [symbol, fetchKlines]);

    useEffect(() => {
        if (!symbol || symbol.length < 3) return;
        const interval = setInterval(() => {
            if (currentSymbolRef.current === symbol) fetchKlines(symbol);
        }, 15000);
        return () => clearInterval(interval);
    }, [symbol, fetchKlines]);

    const refetch = useCallback(() => { fetchKlines(currentSymbolRef.current); }, [fetchKlines]);

    return { data, loading, error, refetch };
}
