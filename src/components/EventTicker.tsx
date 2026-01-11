import React from 'react';
import { AlertTriangle, Clock, Info } from 'lucide-react';
import { useEconomicEvents, type EconomicEvent } from '../hooks/useEconomicEvents';

export const EventTicker: React.FC = () => {
    const { events } = useEconomicEvents();

    if (events.length === 0) return null;

    const getImpactColor = (impact: EconomicEvent['impact']) => {
        switch (impact) {
            case 'HIGH': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'MEDIUM': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            case 'LOW': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        }
    };

    const getImpactIcon = (impact: EconomicEvent['impact']) => {
        switch (impact) {
            case 'HIGH': return <AlertTriangle size={12} />;
            case 'MEDIUM': return <Info size={12} />;
            case 'LOW': return <Clock size={12} />;
        }
    };

    return (
        <div className="w-full bg-slate-900/50 border-b border-white/5 overflow-hidden h-8 flex items-center">
            <div className="flex-shrink-0 bg-red-600 px-3 h-full flex items-center z-10 shadow-lg">
                <span className="text-[10px] font-black text-white whitespace-nowrap uppercase tracking-tighter">
                    LỊCH SỰ KIỆN
                </span>
            </div>

            <div className="flex-1 overflow-hidden relative h-full">
                <div className="flex animate-ticker hover:pause-ticker whitespace-nowrap gap-12 items-center h-full">
                    {/* Double the list for infinite scrolling */}
                    {[...events, ...events].map((event, idx) => (
                        <div key={`${event.id}-${idx}`} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{event.country}</span>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold ${getImpactColor(event.impact)}`}>
                                {getImpactIcon(event.impact)}
                                {event.title}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                                {event.time}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 px-4 h-full flex items-center bg-slate-900/80 backdrop-blur-sm z-10 border-l border-white/5">
                <span className="text-[9px] text-slate-500 font-medium">UTC+7</span>
            </div>
        </div>
    );
};
