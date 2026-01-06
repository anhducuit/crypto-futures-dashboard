import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface PendingTrade {
    id: string;
    symbol: string;
    signal: 'LONG' | 'SHORT' | 'NEUTRAL';
    target_price: number;
    stop_loss: number;
    status: 'PENDING';
}

export const TradeMonitor = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const tradesRef = useRef<PendingTrade[]>([]);

    // Fetch Pending Trades
    const fetchTrades = async () => {
        try {
            const { data: trades, error } = await supabase
                .from('trading_history')
                .select('*')
                .eq('status', 'PENDING');

            if (error) {
                console.error('Error fetching pending trades:', error);
                return;
            }

            if (trades) {
                tradesRef.current = trades as PendingTrade[];
                console.log(`TradeMonitor: Monitoring ${trades.length} pending trades`);
            }
        } catch (e) {
            console.error('Fetch error:', e);
        }
    };

    // Initial Fetch & Poll
    useEffect(() => {
        fetchTrades();
        const pollInterval = setInterval(fetchTrades, 15000); // Refresh list every 15s in case new trades appear
        return () => clearInterval(pollInterval);
    }, []);

    // WebSocket Connection
    useEffect(() => {
        const connect = () => {
            // !miniTicker@arr gives 24h ticker for ALL symbols
            const ws = new WebSocket('wss://fstream.binance.com/ws/!miniTicker@arr');
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('TradeMonitor: Connected to Binance All-Ticker Stream');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (!Array.isArray(data)) return;

                    const trades = tradesRef.current;
                    if (trades.length === 0) return;

                    // Convert array to map for faster lookup if needed, but array iteration is fine for <100 trades
                    // Data format: { s: symbol, c: current_price, ... }

                    data.forEach(async (ticker: any) => {
                        const symbol = ticker.s; // e.g., BTCUSDT
                        const currentPrice = parseFloat(ticker.c);

                        // Find pending trades for this symbol
                        const matchingTrades = trades.filter(t => t.symbol === symbol);

                        for (const trade of matchingTrades) {
                            let newStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';

                            if (trade.signal === 'NEUTRAL') {
                                newStatus = 'SUCCESS';
                            } else if (trade.signal === 'LONG') {
                                if (currentPrice >= trade.target_price) newStatus = 'SUCCESS';
                                else if (currentPrice <= trade.stop_loss) newStatus = 'FAILED';
                            } else if (trade.signal === 'SHORT') {
                                if (currentPrice <= trade.target_price) newStatus = 'SUCCESS';
                                else if (currentPrice >= trade.stop_loss) newStatus = 'FAILED';
                            }

                            if (newStatus !== 'PENDING') {
                                // Optimistically remove from ref to prevent double update attempts
                                tradesRef.current = tradesRef.current.filter(t => t.id !== trade.id);

                                // Update Supabase
                                const { error } = await supabase
                                    .from('trading_history')
                                    .update({ status: newStatus })
                                    .eq('id', trade.id);

                                if (error) {
                                    console.error(`Failed to update trade ${trade.id}:`, error);
                                    // Add back if failed? Or just let next fetch pick it up
                                } else {
                                    console.log(`TradeMonitor: Trade ${trade.symbol} ${newStatus}! (Price: ${currentPrice})`);
                                }
                            }
                        }
                    });
                } catch (e) {
                    console.error('WS Message Error:', e);
                }
            };

            ws.onclose = () => {
                console.log('TradeMonitor: Disconnected, reconnecting in 5s...');
                setTimeout(connect, 5000);
            };

            ws.onerror = (err) => {
                console.error('TradeMonitor WS Error:', err);
            };
        };

        connect();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    return null;
};
