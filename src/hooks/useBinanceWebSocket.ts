import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketState {
    isConnected: boolean;
    currentPrice: number | null;
    previousPrice: number | null;
    priceDirection: 'up' | 'down' | null;
    error: string | null;
    lastUpdate: number | null;
}

export function useBinanceWebSocket(symbol: string) {
    const [state, setState] = useState<WebSocketState>({
        isConnected: false,
        currentPrice: null,
        previousPrice: null,
        priceDirection: null,
        error: null,
        lastUpdate: null
    });

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const currentSymbolRef = useRef(symbol); // Track current symbol
    const maxReconnectAttempts = 5;

    // Update ref when symbol changes
    useEffect(() => {
        currentSymbolRef.current = symbol;
    }, [symbol]);

    const connect = useCallback((targetSymbol: string) => {
        if (!targetSymbol) return;

        const normalizedSymbol = targetSymbol.toLowerCase().replace('/', '');
        const wsUrl = `wss://stream.binance.com:9443/ws/${normalizedSymbol}@trade`;

        try {
            // Close existing connection
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            // Clear any pending reconnect
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            console.log(`Connecting WebSocket: ${normalizedSymbol}`);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                // Check if symbol hasn't changed during connection
                if (currentSymbolRef.current.toLowerCase().replace('/', '') !== normalizedSymbol) {
                    console.log(`Symbol changed during connection, closing: ${normalizedSymbol}`);
                    ws.close();
                    return;
                }

                console.log(`WebSocket connected: ${normalizedSymbol}`);
                setState(prev => ({
                    ...prev,
                    isConnected: true,
                    error: null
                }));
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                // Check if this message is for current symbol
                if (currentSymbolRef.current.toLowerCase().replace('/', '') !== normalizedSymbol) {
                    return;
                }

                try {
                    const data = JSON.parse(event.data);
                    const newPrice = parseFloat(data.p);

                    setState(prev => ({
                        ...prev,
                        previousPrice: prev.currentPrice,
                        currentPrice: newPrice,
                        priceDirection: prev.currentPrice !== null
                            ? (newPrice > prev.currentPrice ? 'up' : newPrice < prev.currentPrice ? 'down' : prev.priceDirection)
                            : null,
                        lastUpdate: Date.now()
                    }));
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setState(prev => ({
                    ...prev,
                    error: 'Lỗi kết nối WebSocket. Vui lòng nhập giá thủ công.'
                }));
            };

            ws.onclose = () => {
                console.log(`WebSocket disconnected: ${normalizedSymbol}`);

                // Only update state if this was our current connection
                if (wsRef.current === ws) {
                    setState(prev => ({
                        ...prev,
                        isConnected: false
                    }));

                    // Only reconnect if symbol hasn't changed
                    if (currentSymbolRef.current.toLowerCase().replace('/', '') === normalizedSymbol) {
                        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                            reconnectAttemptsRef.current++;
                            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

                            reconnectTimeoutRef.current = setTimeout(() => {
                                // Double check symbol before reconnecting
                                if (currentSymbolRef.current.toLowerCase().replace('/', '') === normalizedSymbol) {
                                    console.log(`Reconnecting ${normalizedSymbol}... Attempt ${reconnectAttemptsRef.current}`);
                                    connect(targetSymbol);
                                }
                            }, delay);
                        } else {
                            setState(prev => ({
                                ...prev,
                                error: 'Không thể kết nối lại. Vui lòng nhập giá thủ công.'
                            }));
                        }
                    }
                }
            };
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setState(prev => ({
                ...prev,
                error: 'Không thể tạo kết nối WebSocket.'
            }));
        }
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const setManualPrice = useCallback((price: number) => {
        setState(prev => ({
            ...prev,
            previousPrice: prev.currentPrice,
            currentPrice: price,
            priceDirection: prev.currentPrice !== null
                ? (price > prev.currentPrice ? 'up' : price < prev.currentPrice ? 'down' : prev.priceDirection)
                : null,
            lastUpdate: Date.now()
        }));
    }, []);

    // Connect when symbol changes
    useEffect(() => {
        if (symbol && symbol.length >= 3) {
            // Reset state for new symbol
            setState({
                isConnected: false,
                currentPrice: null,
                previousPrice: null,
                priceDirection: null,
                error: null,
                lastUpdate: null
            });
            reconnectAttemptsRef.current = 0;

            // Connect with new symbol
            connect(symbol);
        }

        return () => {
            disconnect();
        };
    }, [symbol, connect, disconnect]);

    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        connect(currentSymbolRef.current);
    }, [connect]);

    return {
        ...state,
        disconnect,
        setManualPrice,
        reconnect
    };
}
