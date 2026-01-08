import { useEffect } from 'react';

/**
 * useSignalGenerator - DEPRECATED
 * Signal generation is now handled entirely on the server-side (Supabase Edge Functions).
 * This hook is kept as a placeholder to prevent build errors in components that still import it.
 */
export function useSignalGenerator(
    symbol: string,
    maAnalysis: any,
    currentPrice: number
) {
    useEffect(() => {
        // Log to console so user knows this is disabled
        if (symbol && currentPrice) {
            // console.log('Client-side signal generation is disabled. Monitoring server signals...');
        }
    }, [symbol, currentPrice]);

    return null;
}
