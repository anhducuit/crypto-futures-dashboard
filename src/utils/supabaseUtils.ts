import { supabase } from '../lib/supabase';

export const saveSignalToSupabase = async (
    symbol: string,
    tfLabel: string,
    signal: 'LONG' | 'SHORT',
    price: number,
    rsi: number,
    volRatio: number,
    priceGap: number,
    lastSavedRef: React.MutableRefObject<Record<string, number>>
) => {
    try {
        const key = `${symbol}_${tfLabel}`;
        const now = Date.now();

        // Cooldown: 1 hour per timeframe signal
        if (lastSavedRef.current[key] && now - lastSavedRef.current[key] < 3600000) {
            return;
        }

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
        console.log(`Saved background signal for ${symbol} - ${tfLabel}: ${signal}`);
    } catch (e) {
        console.error('Failed to save signal:', e);
    }
};
