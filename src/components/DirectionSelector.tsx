import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DirectionSelectorProps {
    direction: 'long' | 'short';
    onDirectionChange: (direction: 'long' | 'short') => void;
}

export const DirectionSelector: React.FC<DirectionSelectorProps> = ({
    direction,
    onDirectionChange
}) => {
    return (
        <div className="flex gap-3">
            <button
                onClick={() => onDirectionChange('long')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${direction === 'long'
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/25'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                    }`}
            >
                <TrendingUp size={20} />
                LONG
            </button>
            <button
                onClick={() => onDirectionChange('short')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${direction === 'short'
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                    }`}
            >
                <TrendingDown size={20} />
                SHORT
            </button>
        </div>
    );
};
