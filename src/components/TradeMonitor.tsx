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
                const pendingTrades = trades as PendingTrade[];
                tradesRef.current = pendingTrades;

                // Fast-track: Process NEUTRAL signals immediately
                const neutralTrades = pendingTrades.filter(t => t.signal === 'NEUTRAL');
                for (const trade of neutralTrades) {
                    await updateTradeStatus(trade, 'SUCCESS', 0);
                }

                // Remove processed neutrals from monitoring list
                if (neutralTrades.length > 0) {
                    tradesRef.current = pendingTrades.filter(t => t.signal !== 'NEUTRAL');
                }

                console.log(`TradeMonitor: Monitoring ${tradesRef.current.length} pending trades`);
            }
        } catch (e) {
            console.error('Fetch error:', e);
        }
    };

    const updateTradeStatus = async (trade: PendingTrade, status: 'SUCCESS' | 'FAILED', price: number) => {
        const { error } = await supabase
            .from('trading_history')
            .update({ status })
            .eq('id', trade.id);

        if (error) {
            console.error(`Failed to update trade ${trade.id}:`, error);
        } else {
            console.log(`TradeMonitor: Trade ${trade.symbol} ${status}! (Price: ${price})`);
            // Remove from local ref to prevent double updates
            tradesRef.current = tradesRef.current.filter(t => t.id !== trade.id);
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

                    data.forEach(async (ticker: any) => {
                        const symbol = ticker.s;
                        const currentPrice = parseFloat(ticker.c);

                        // Find pending trades for this symbol
                        const matchingTrades = trades.filter(t => t.symbol === symbol);

                        for (const trade of matchingTrades) {
                            let newStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';

                            if (trade.signal === 'LONG') {
                                if (currentPrice >= trade.target_price) newStatus = 'SUCCESS';
                                else if (currentPrice <= trade.stop_loss) newStatus = 'FAILED';
                            } else if (trade.signal === 'SHORT') {
                                if (currentPrice <= trade.target_price) newStatus = 'SUCCESS';
                                else if (currentPrice >= trade.stop_loss) newStatus = 'FAILED';
                            }

                            if (newStatus !== 'PENDING') {
                                await updateTradeStatus(trade, newStatus, currentPrice);
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

    return (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 rounded-full border border-slate-800 shadow-xl backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${wsRef.current?.readyState === 1 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-mono text-slate-400">
                BOT: {tradesRef.current.length} PENDING
            </span>
        </div>
    );
};
