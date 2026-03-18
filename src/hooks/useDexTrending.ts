import { useState, useEffect, useCallback, useRef } from 'react';

export interface DexPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        m5?: { buys: number; sells: number };
        h1?: { buys: number; sells: number };
        h6?: { buys: number; sells: number };
        h24?: { buys: number; sells: number };
    };
    volume: {
        h24: number;
        h6?: number;
        h1?: number;
        m5?: number;
    };
    priceChange: {
        h24: number;
        h6?: number;
        h1?: number;
        m5?: number;
    };
    liquidity?: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv?: number;
    marketCap?: number;
    pairCreatedAt?: number;
    info?: {
        imageUrl?: string;
        websites?: { label: string; url: string }[];
        socials?: { type: string; url: string }[];
    };
}

export const useDexTrending = () => {
    const [pairs, setPairs] = useState<DexPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastUpdateRef = useRef<number>(Date.now());

    const fetchTrending = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            
            // 1. Fetch latest "Profiled" tokens (usually hot/trending)
            const profileResponse = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
            if (!profileResponse.ok) throw new Error('Failed to fetch token profiles');
            const profiles = await profileResponse.json();
            
            if (profiles && Array.isArray(profiles)) {
                // Get top 25 tokens with profiles
                const topProfiles = profiles.slice(0, 25);
                const tokenAddresses = topProfiles.map(p => p.tokenAddress).join(',');
                
                // 2. Fetch specific pair data for these tokens
                const pairResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddresses}`);
                if (!pairResponse.ok) throw new Error('Failed to fetch pair details');
                const pairData = await pairResponse.json();
                
                if (pairData.pairs) {
                    // Normalize: match profile info (icons) with pair data
                    const enrichedPairs = pairData.pairs.filter((p: any) => p.quoteToken.symbol === 'SOL' || p.quoteToken.symbol === 'WETH' || p.quoteToken.symbol === 'USDC' || p.quoteToken.symbol === 'USDT');
                    
                    // Add icons from profiles if missing in pairs
                    const finalPairs = enrichedPairs.map((pair: any) => {
                        const profile = topProfiles.find(pf => pf.tokenAddress === pair.baseToken.address && pf.chainId === pair.chainId);
                        return {
                            ...pair,
                            info: {
                                ...pair.info,
                                imageUrl: pair.info?.imageUrl || profile?.icon || profile?.header
                            }
                        };
                    });

                    // Sort by volume h24 descending
                    const sortedPairs = finalPairs.sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
                    setPairs(sortedPairs.slice(0, 30));
                    lastUpdateRef.current = Date.now();
                }
            }
            setError(null);
        } catch (err: any) {
            console.error('DexTrending Error:', err);
            setError(err.message);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrending(true);
        // Faster updates for "live" feel
        const interval = setInterval(() => fetchTrending(false), 30000); 
        return () => clearInterval(interval);
    }, [fetchTrending]);

    return { pairs, loading, error, refetch: () => fetchTrending(true), lastUpdate: lastUpdateRef.current };
};
