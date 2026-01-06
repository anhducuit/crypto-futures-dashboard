import React, { useState, useEffect, useRef } from 'react';
import { Search, Wifi, WifiOff, RefreshCw } from 'lucide-react';

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

        // Debounce the symbol change
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            if (value.length >= 3) {
                onSymbolChange(value);
            }
        }, 500);
    };

    const commonSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Nhập Symbol (VD: BTCUSDT)"
                    className="pl-12 pr-12 w-full uppercase"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isConnected ? (
                        <div className="flex items-center gap-1.5 text-green-500">
                            <div className="status-dot connected"></div>
                            <Wifi size={16} />
                        </div>
                    ) : (
                        <button
                            onClick={onReconnect}
                            className="flex items-center gap-1.5 text-red-500 hover:text-red-400 transition-colors"
                            title="Kết nối lại"
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
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${symbol === sym
                            ? 'bg-[var(--color-golden)] text-black font-semibold'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                            }`}
                    >
                        {sym}
                    </button>
                ))}
            </div>
        </div>
    );
};
