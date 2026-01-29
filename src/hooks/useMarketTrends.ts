import { useState, useEffect } from 'react';

export interface MarketCoin {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    quoteVolume: string;
}

export function useMarketTrends() {
    const [gold, setGold] = useState<MarketCoin | null>(null);
    const [silver, setSilver] = useState<MarketCoin | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
            const data = await response.json();

            if (Array.isArray(data)) {
                const goldData = data.find((coin: any) => coin.symbol === 'XAUUSDT');
                const silverData = data.find((coin: any) => coin.symbol === 'XAGUSDT');

                if (goldData) {
                    setGold({
                        symbol: goldData.symbol,
                        lastPrice: goldData.lastPrice,
                        priceChangePercent: goldData.priceChangePercent,
                        quoteVolume: goldData.quoteVolume
                    });
                }
                if (silverData) {
                    setSilver({
                        symbol: silverData.symbol,
                        lastPrice: silverData.lastPrice,
                        priceChangePercent: silverData.priceChangePercent,
                        quoteVolume: silverData.quoteVolume
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching gold/silver trends:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return { gold, silver, loading, refetch: fetchData };
}
