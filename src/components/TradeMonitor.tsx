import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PendingTrade {
    id: string;
    symbol: string;
    signal: 'LONG' | 'SHORT';
    target_price: number;
    stop_loss: number;
    status: 'PENDING';
}

export const TradeMonitor = () => {
    useEffect(() => {
        const checkTrades = async () => {
            try {
                // Fetch pending trades
                const { data: trades, error } = await supabase
                    .from('trading_history')
                    .select('*')
                    .eq('status', 'PENDING');

                if (error || !trades || trades.length === 0) return;

                // For each trade, check price
                for (const trade of trades as PendingTrade[]) {
                    try {
                        // Fetch price from Binance Futures REST API
                        // Using fetch directly to avoid dependency on hooks/websocket for this background task
                        const res = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${trade.symbol}`);
                        if (!res.ok) continue;

                        const json = await res.json();
                        const currentPrice = parseFloat(json.price);

                        if (isNaN(currentPrice)) continue;

                        let newStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';

                        if (trade.signal === 'LONG') {
                            if (currentPrice >= trade.target_price) newStatus = 'SUCCESS';
                            else if (currentPrice <= trade.stop_loss) newStatus = 'FAILED';
                        } else if (trade.signal === 'SHORT') {
                            if (currentPrice <= trade.target_price) newStatus = 'SUCCESS';
                            else if (currentPrice >= trade.stop_loss) newStatus = 'FAILED';
                        }

                        if (newStatus !== 'PENDING') {
                            const { error: updateError } = await supabase
                                .from('trading_history')
                                .update({ status: newStatus })
                                .eq('id', trade.id);

                            if (updateError) {
                                console.error(`Failed to update trade ${trade.id}:`, updateError);
                            } else {
                                console.log(`Trade Monitor: Updated trade ${trade.id} (${trade.symbol}) to ${newStatus}`);
                            }
                        }
                    } catch (innerErr) {
                        console.error(`Error processing trade ${trade.id}:`, innerErr);
                    }
                }
            } catch (e) {
                console.error('Trade Monitor Error:', e);
            }
        };

        // Run check every 10 seconds
        const interval = setInterval(checkTrades, 10000);
        checkTrades(); // Run immediately on mount

        return () => clearInterval(interval);
    }, []);

    return null; // This component does not render anything
};
