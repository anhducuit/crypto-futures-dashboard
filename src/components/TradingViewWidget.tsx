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
            let studies: string[] = ["RSI@tv-basicstudies"];

            if (timeframe === "1") {
                // 1m Scalp: MA7, MA25
                studies.push("MASimple@tv-basicstudies"); // MA1
                studies.push("MASimple@tv-basicstudies"); // MA2
            } else if (timeframe === "15") {
                // 15m Day: MA12, MA26
                studies.push("MASimple@tv-basicstudies");
                studies.push("MASimple@tv-basicstudies");
            } else if (timeframe === "60") {
                // 1h Swing: MA20, MA50
                studies.push("MASimple@tv-basicstudies");
                studies.push("MASimple@tv-basicstudies");
            } else if (timeframe === "240") {
                // 4h Trend: MA50, MA200
                studies.push("MASimple@tv-basicstudies");
                studies.push("MASimple@tv-basicstudies");
            }

            const widgetConfig: any = {
                "autosize": true,
                "symbol": formattedSymbol,
                "interval": timeframe,
                "timezone": "Asia/Ho_Chi_Minh",
                "theme": "dark",
                "style": "1",
                "locale": "vi_VN",
                "backgroundColor": "rgba(15, 15, 20, 1)",
                "gridColor": "rgba(45, 45, 61, 0.3)",
                "hide_top_toolbar": false,
                "hide_legend": false,
                "allow_symbol_change": true,
                "save_image": false,
                "calendar": false,
                "hide_volume": false,
                "support_host": "https://www.tradingview.com",
                "studies": studies
            };

            // Customize MA lengths using overrides if possible, 
            // but TV Embed Widget MASimple defaults to some values.
            // For true customization we might need the Advanced Charting Library (requires license/hosting).
            // However, we can use a workaround by passing inputs via studies.

            if (timeframe === "1") {
                widgetConfig["studies_overrides"] = {
                    "moving average.length": 7,
                    "moving average.2.length": 25
                };
            }

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
            script.type = 'text/javascript';
            script.async = true;
            script.innerHTML = JSON.stringify(widgetConfig);

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
