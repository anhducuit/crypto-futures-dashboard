import { useState, useEffect, useRef } from 'react';

export interface TickerData {
    symbol: string;
    price: number;
    changePercent: number;
    direction: 'up' | 'down' | null;
}

const BOT_SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
    'ADAUSDT', 'DOGEUSDT', 'LINKUSDT', 'AVAXUSDT', 'NEARUSDT',
    'FTMUSDT', 'OPUSDT', 'ARBUSDT', 'TIAUSDT', 'INJUSDT'
];

export function useBinanceTicker() {
    const [tickers, setTickers] = useState<Record<string, TickerData>>({});
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const streams = BOT_SYMBOLS.map(s => `${s.toLowerCase()}@ticker`).join('/');
        const wsUrl = `wss://fstream.binance.com/stream?streams=${streams}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.data) {
                    const d = msg.data;
                    const symbol = d.s;
                    const price = parseFloat(d.c);
                    const changePercent = parseFloat(d.P);

                    setTickers(prev => {
                        const oldPrice = prev[symbol]?.price;
                        return {
                            ...prev,
                            [symbol]: {
                                symbol,
                                price,
                                changePercent,
                                direction: oldPrice ? (price > oldPrice ? 'up' : price < oldPrice ? 'down' : prev[symbol].direction) : null
                            }
                        };
                    });
                }
            } catch (err) {
                console.error('Error parsing ticker ws:', err);
            }
        };

        ws.onerror = (e) => console.error('Ticker WS Error:', e);
        ws.onclose = () => console.log('Ticker WS Closed');

        return () => {
            ws.close();
        };
    }, []);

    return { tickers, symbols: BOT_SYMBOLS };
}
