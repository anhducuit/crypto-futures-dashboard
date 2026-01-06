import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface PendingTrade {
    id: string;
    created_at: string;
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

                // Run Audit on remaining trades to check for past Wicks
                auditTrades(tradesRef.current);
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

    // Audit Pending Trades (Check Historical Candles)
    const auditTrades = async (trades: PendingTrade[]) => {
        const groupedTrades = trades.reduce((acc, trade) => {
            if (!acc[trade.symbol]) acc[trade.symbol] = [];
            acc[trade.symbol].push(trade);
            return acc;
        }, {} as Record<string, PendingTrade[]>);

        for (const symbol in groupedTrades) {
            try {
                // Fetch last 1000 candles (approx 16 hours of 1m data) to cover recent history
                // Ideally we use startTime based on the oldest trade, but last 1000 1m candles is a safe simple batch
                const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&limit=1000`);
                const data = await res.json();

                if (!Array.isArray(data)) continue;

                const candles = data.map((c: any) => ({
                    openTime: c[0],
                    high: parseFloat(c[2]),
                    low: parseFloat(c[3]),
                    closeTime: c[6]
                }));

                for (const trade of groupedTrades[symbol]) {
                    const tradeTime = new Date(trade.created_at).getTime();

                    // Filter candles that happened AFTER trade creation
                    const relevantCandles = candles.filter(c => c.closeTime >= tradeTime);

                    let newStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';
                    let triggerPrice = 0;

                    for (const candle of relevantCandles) {
                        if (trade.signal === 'LONG') {
                            if (candle.high >= trade.target_price) {
                                newStatus = 'SUCCESS';
                                triggerPrice = trade.target_price;
                                break;
                            }
                            if (candle.low <= trade.stop_loss) {
                                newStatus = 'FAILED';
                                triggerPrice = trade.stop_loss;
                                break;
                            }
                        } else if (trade.signal === 'SHORT') {
                            if (candle.low <= trade.target_price) {
                                newStatus = 'SUCCESS';
                                triggerPrice = trade.target_price;
                                break;
                            }
                            if (candle.high >= trade.stop_loss) {
                                newStatus = 'FAILED';
                                triggerPrice = trade.stop_loss;
                                break;
                            }
                        }
                    }

                    if (newStatus !== 'PENDING') {
                        await updateTradeStatus(trade, newStatus, triggerPrice);
                    }
                }
            } catch (err) {
                console.error(`Audit error for ${symbol}:`, err);
            }
        }
    };

    // Initial Fetch & Poll
    useEffect(() => {
        fetchTrades();
        const pollInterval = setInterval(fetchTrades, 30000); // Check every 30s
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
