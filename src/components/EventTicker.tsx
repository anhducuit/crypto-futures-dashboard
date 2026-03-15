import React from 'react';
import { AlertTriangle, Clock, Info, Activity } from 'lucide-react';
import { useEconomicEvents, type EconomicEvent } from '../hooks/useEconomicEvents';
import { useTranslation, type Language } from '../utils/translations';

interface EventTickerProps {
    language: Language;
}

export const EventTicker: React.FC<EventTickerProps> = ({ language }) => {
    const { events, loading } = useEconomicEvents();
    const t = useTranslation(language);

    if (loading) {
        return (
            <div className="w-full bg-black/40 border-b border-white/5 h-7 flex items-center justify-center">
                <span className="text-[9px] font-black text-[var(--color-silver)] opacity-30 animate-pulse uppercase tracking-[0.3em] italic">{t('loading_events')}</span>
            </div>
        );
    }

    const displayEvents = events.length > 0 ? events : [
        { id: 'none', title: t('no_important_events'), impact: 'LOW', time: '--:--', date: '--/--', country: 'ALL' }
    ] as any;

    const getImpactColor = (impact: EconomicEvent['impact']) => {
        switch (impact) {
            case 'HIGH': return 'text-[var(--color-short)] bg-[var(--color-short)]/5 border-[var(--color-short)]/20';
            case 'MEDIUM': return 'text-orange-400 bg-orange-400/5 border-orange-400/20';
            case 'LOW': return 'text-[var(--color-flare)] bg-[var(--color-flare)]/5 border-[var(--color-flare)]/20';
            case 'HOLIDAY': return 'text-[var(--color-silver)] bg-white/5 border-white/10 opacity-60';
        }
    };

    const getImpactIcon = (impact: EconomicEvent['impact']) => {
        switch (impact) {
            case 'HIGH': return <AlertTriangle size={10} strokeWidth={3} />;
            case 'MEDIUM': return <Info size={10} strokeWidth={3} />;
            case 'LOW': return <Clock size={10} strokeWidth={3} />;
            case 'HOLIDAY': return <Activity size={10} strokeWidth={3} />;
        }
    };

    return (
        <div className="w-full bg-black/60 border-b border-white/5 overflow-hidden h-7 flex items-center">
            <div className="flex-shrink-0 bg-[var(--color-short)] px-3 h-full flex items-center z-10 shadow-[4px_0_15px_rgba(0,0,0,0.5)]">
                <span className="text-[9px] font-black text-white whitespace-nowrap uppercase tracking-[0.2em] italic">
                    {t('event_calendar')}
                </span>
            </div>

            <div className="flex-1 overflow-hidden relative h-full">
                <div className="flex animate-ticker hover:pause-ticker whitespace-nowrap gap-12 items-center h-full">
                    {[...displayEvents, ...displayEvents].map((event, idx) => (
                        <div key={`${event.id}-${idx}`} className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-[var(--color-silver)] opacity-20 uppercase tracking-widest">{event.country}</span>
                            <div className={`flex items-center gap-2 px-2 py-0.5 rounded-[1px] border text-[9px] font-black italic tracking-wider ${getImpactColor(event.impact)} uppercase`}>
                                {getImpactIcon(event.impact)}
                                {event.title}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-black text-white tracking-widest opacity-60">
                                    {event.time}
                                </span>
                                <span className="text-[8px] font-black text-[var(--color-silver)] bg-white/5 px-1.5 py-0.5 rounded-[1px] border border-white/10 opacity-30 italic">
                                    {event.date}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 px-4 h-full flex items-center bg-black/80 backdrop-blur-md z-10 border-l border-white/5">
                <span className="text-[8px] font-black text-[var(--color-silver)] opacity-30 tracking-[0.2em] uppercase italic">UTC+7</span>
            </div>
        </div>
    );
};
