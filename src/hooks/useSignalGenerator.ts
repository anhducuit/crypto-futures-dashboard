import { useEffect } from 'react';

/**
 * useSignalGenerator - DEPRECATED
 * Signal generation is now handled entirely on the server-side (Supabase Edge Functions).
 * This hook is kept as a placeholder to prevent build errors in components that still import it.
 */
export function useSignalGenerator() {
    useEffect(() => {
        // Client-side signal generation is disabled. 
        // Logic moved to Supabase Edge Functions.
    }, []);

    return null;
}
