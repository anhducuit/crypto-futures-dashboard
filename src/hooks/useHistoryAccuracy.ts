import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useHistoryAccuracy(currentPrice: number | null, symbol: string) {
    const lastCheckRef = useRef<number>(0);

    useEffect(() => {
        if (!currentPrice || !symbol) return;

        const checkAccuracy = async () => {
            const now = Date.now();
            // Throttle checks to once every 10 seconds
            if (now - lastCheckRef.current < 10000) return;
            lastCheckRef.current = now;

            try {
                // Fetch PENDING signals for the current symbol
                const { data: pendingSignals, error } = await supabase
                    .from('trading_history')
                    .select('*')
                    .eq('status', 'PENDING')
                    .eq('symbol', symbol.toUpperCase());

                if (error) throw error;
                if (!pendingSignals || pendingSignals.length === 0) return;

                for (const signal of pendingSignals) {
                    let newStatus: 'SUCCESS' | 'FAILED' | null = null;

                    if (signal.signal === 'LONG') {
                        if (currentPrice >= signal.target_price) newStatus = 'SUCCESS';
                        else if (currentPrice <= signal.stop_loss) newStatus = 'FAILED';
                    } else if (signal.signal === 'SHORT') {
                        if (currentPrice <= signal.target_price) newStatus = 'SUCCESS';
                        else if (currentPrice >= signal.stop_loss) newStatus = 'FAILED';
                    }

                    if (newStatus) {
                        await supabase
                            .from('trading_history')
                            .update({ status: newStatus })
                            .eq('id', signal.id);

                        console.log(`Updated signal ${signal.id} status to ${newStatus}`);
                    }
                }
            } catch (e) {
                console.error('Error tracking accuracy:', e);
            }
        };

        checkAccuracy();
    }, [currentPrice, symbol]);
}
