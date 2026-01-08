import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
    symbol: string;
    timeframe?: string;
}

declare global {
    interface Window {
        TradingView: any;
    }
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol, timeframe = "15" }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadWidget = () => {
            if (!containerRef.current) return;

            // Clear any existing widget
            containerRef.current.innerHTML = '';

            // Format symbol for TradingView Perpetual Futures
            const cleanSymbol = symbol ? symbol.toUpperCase().replace('/', '') : 'BTCUSDT';
            const formattedSymbol = `BINANCE:${cleanSymbol}.P`;

            // Configure dynamic MA studies based on timeframe
            let studies: any[] = [{ id: "RSI@tv-basicstudies" }];

            if (timeframe === "1") {
                // 1m Scalp: MA7, MA25
                studies.push({ id: "MASimple@tv-basicstudies", inputs: { length: 7 } });
                studies.push({ id: "MASimple@tv-basicstudies", inputs: { length: 25 } });
            } else if (timeframe === "15") {
                // 15m Day: MA12, MA26
                studies.push({ id: "MASimple@tv-basicstudies", inputs: { length: 12 } });
                studies.push({ id: "MASimple@tv-basicstudies", inputs: { length: 26 } });
            } else if (timeframe === "60") {
                // 1h Swing: MA20, MA50
                studies.push({ id: "MASimple@tv-basicstudies", inputs: { length: 20 } });
                studies.push({ id: "MASimple@tv-basicstudies", inputs: { length: 50 } });
            } else if (timeframe === "240") {
                // 4h Trend: MA50, MA200
                studies.push({ id: "MASimple@tv-basicstudies", inputs: { length: 50 } });
                studies.push({ id: "MASimple@tv-basicstudies", inputs: { length: 200 } });
            }

            const containerId = `tv-chart-${Math.random().toString(36).substr(2, 9)}`;
            const widgetDiv = document.createElement('div');
            widgetDiv.id = containerId;
            widgetDiv.style.height = '100%';
            widgetDiv.style.width = '100%';
            containerRef.current.appendChild(widgetDiv);

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.type = 'text/javascript';
            script.onload = () => {
                if (window.TradingView) {
                    new window.TradingView.widget({
                        "autosize": true,
                        "symbol": formattedSymbol,
                        "interval": timeframe,
                        "timezone": "Asia/Ho_Chi_Minh",
                        "theme": "dark",
                        "style": "1",
                        "locale": "vi_VN",
                        "toolbar_bg": "#f1f3f6",
                        "enable_publishing": false,
                        "hide_side_toolbar": false,
                        "allow_symbol_change": true,
                        "container_id": containerId,
                        "studies": studies
                    });
                }
            };
            containerRef.current.appendChild(script);
        };

        const timer = setTimeout(loadWidget, 100);
        return () => clearTimeout(timer);
    }, [symbol, timeframe]);

    return (
        <div className="card h-full min-h-[500px]">
            <div
                ref={containerRef}
                className="tradingview-widget-container h-full"
                style={{ height: 'calc(100% - 0px)', minHeight: '450px' }}
            >
                <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-golden)] border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p>Đang tải biểu đồ...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
