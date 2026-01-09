import { useState, useEffect } from 'react';

export interface MarketCoin {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    quoteVolume: string;
}

export function useMarketTrends() {
    const [gainers, setGainers] = useState<MarketCoin[]>([]);
    const [losers, setLosers] = useState<MarketCoin[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
            const data = await response.json();

            if (Array.isArray(data)) {
                // Filter for USDT pairs and sort
                const filtered = data
                    .filter((coin: any) => coin.symbol.endsWith('USDT'))
                    .map((coin: any) => ({
                        symbol: coin.symbol,
                        lastPrice: coin.lastPrice,
                        priceChangePercent: coin.priceChangePercent,
                        quoteVolume: coin.quoteVolume
                    }));

                const sorted = [...filtered].sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));

                setGainers(sorted.slice(0, 5));
                setLosers(sorted.slice(-5).reverse());
            }
        } catch (error) {
            console.error('Error fetching market trends:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    return { gainers, losers, loading, refetch: fetchData };
}
