import { useEffect, useRef } from 'react';
import { saveSignalToSupabase } from '../utils/supabaseUtils';

const BTC_TIMEFRAMES = [
    { interval: '1m', label: '1 Phút' },
    { interval: '15m', label: '15 Phút' },
    { interval: '1h', label: '1 Giờ' },
    { interval: '4h', label: '4 Giờ' },
];

export function useBackgroundBTCTracker() {
    const lastSavedRef = useRef<Record<string, number>>({});

    useEffect(() => {
        const fetchAndAnalyzeBTC = async () => {
            const symbol = 'BTCUSDT';

            for (const tf of BTC_TIMEFRAMES) {
                try {
                    const response = await fetch(
                        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf.interval}&limit=50`
                    );
                    if (!response.ok) continue;

                    const rawData = await response.json();
                    if (!Array.isArray(rawData) || rawData.length < 20) continue;

                    const closes = rawData.map((k: any) => parseFloat(k[4]));
                    const volumes = rawData.map((k: any) => parseFloat(k[5]));

                    const currentPrice = closes[closes.length - 1];
                    const ma20 = closes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
                    const priceGap = ((currentPrice - ma20) / ma20) * 100;

                    // Simple Trend check
                    if (Math.abs(priceGap) > 1.0) { // Slightly higher threshold for background auto-save
                        const signal = priceGap > 0 ? 'LONG' : 'SHORT';

                        // We need SRI and Volume Ratio for the saveSignal function
                        // (Calculation logic simplified for background tracker)
                        const avgVol = volumes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
                        const volRatio = volumes[volumes.length - 1] / avgVol;

                        // RSI Calculation (Simplified)
                        let gains = 0, losses = 0;
                        for (let i = closes.length - 14; i < closes.length; i++) {
                            const diff = closes[i] - closes[i - 1];
                            if (diff >= 0) gains += diff; else losses -= diff;
                        }
                        const rsi = losses === 0 ? 100 : 100 - (100 / (1 + (gains / losses)));

                        await saveSignalToSupabase(
                            symbol,
                            tf.label,
                            signal,
                            currentPrice,
                            rsi,
                            volRatio,
                            priceGap,
                            lastSavedRef
                        );
                    }
                } catch (e) {
                    console.error(`BTC Tracker error (${tf.label}):`, e);
                }
            }
        };

        // Initial run
        fetchAndAnalyzeBTC();

        // Run every 2 minutes
        const interval = setInterval(fetchAndAnalyzeBTC, 120000);
        return () => clearInterval(interval);
    }, []);
}
