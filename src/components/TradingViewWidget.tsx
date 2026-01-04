import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
    symbol: string;
}

declare global {
    interface Window {
        TradingView: any;
    }
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        const loadWidget = () => {
            if (!containerRef.current) return;

            // Clear any existing widget
            containerRef.current.innerHTML = '';

            // Format symbol for TradingView (e.g., BTCUSDT -> BINANCE:BTCUSDT)
            const formattedSymbol = symbol ? `BINANCE:${symbol.toUpperCase()}` : 'BINANCE:BTCUSDT';

            // Create widget container
            const widgetContainer = document.createElement('div');
            widgetContainer.className = 'tradingview-widget-container__widget';
            widgetContainer.style.height = '100%';
            widgetContainer.style.width = '100%';
            containerRef.current.appendChild(widgetContainer);

            // Create and configure script
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
            script.type = 'text/javascript';
            script.async = true;
            script.innerHTML = JSON.stringify({
                "autosize": true,
                "symbol": formattedSymbol,
                "interval": "15",
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
                "studies": [
                    "MASimple@tv-basicstudies",
                    "RSI@tv-basicstudies"
                ]
            });

            containerRef.current.appendChild(script);
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(loadWidget, 100);
        return () => clearTimeout(timer);
    }, [symbol]);

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
