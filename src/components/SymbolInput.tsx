import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SymbolInputProps {
    symbol: string;
    onSymbolChange: (symbol: string) => void;
    isConnected: boolean;
    onReconnect: () => void;
}

export const SymbolInput: React.FC<SymbolInputProps> = ({
    symbol,
    onSymbolChange,
    isConnected,
    onReconnect
}) => {
    const [inputValue, setInputValue] = useState(symbol);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setInputValue(symbol);
    }, [symbol]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setInputValue(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            if (value.length >= 3) {
                onSymbolChange(value);
            }
        }, 500);
    };

    const commonSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'NEARUSDT'];

    return (
        <div className="space-y-3">
            <div className="relative group">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="PROTOCOL_ENTRY (e.g. BTCUSDT)"
                    className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-[2px] pl-4 pr-12 py-2 text-sm font-black tracking-widest uppercase focus:border-[var(--color-flare)] focus:ring-1 focus:ring-[var(--color-flare)]/20 transition-all outline-none placeholder:opacity-30"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    {isConnected ? (
                        <div className="flex items-center gap-2 text-[var(--color-long)]">
                            <Wifi size={16} className="animate-pulse" />
                        </div>
                    ) : (
                        <button
                            onClick={onReconnect}
                            className="flex items-center gap-2 text-[var(--color-short)] hover:text-red-400 transition-colors"
                            title="Signal Re-entry"
                        >
                            <WifiOff size={16} />
                            <RefreshCw size={14} className="hover:animate-spin" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {commonSymbols.map((sym) => (
                    <button
                        key={sym}
                        onClick={() => {
                            setInputValue(sym);
                            onSymbolChange(sym);
                        }}
                        className={`px-3 py-1 text-[9px] font-black tracking-widest rounded-[2px] transition-all duration-300 ${symbol === sym
                            ? 'bg-[var(--color-flare)] text-black shadow-lg shadow-orange-500/20'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-silver)] hover:bg-[var(--color-border)] hover:text-white'
                            }`}
                    >
                        {sym.replace('USDT', '')}
                    </button>
                ))}
            </div>
        </div>
    );
};
