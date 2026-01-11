import { useState, useEffect } from 'react';

export interface EconomicEvent {
    id: string;
    title: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    time: string;
    country: string;
}

const MOCK_EVENTS: EconomicEvent[] = [
    { id: '1', title: 'CPI m/m (USA)', impact: 'HIGH', time: '19:30', country: 'USD' },
    { id: '2', title: 'Core CPI m/m (USA)', impact: 'HIGH', time: '19:30', country: 'USD' },
    { id: '3', title: 'FOMC Meeting Minutes', impact: 'HIGH', time: '02:00', country: 'USD' },
    { id: '4', title: 'Non-Farm Employment Change', impact: 'HIGH', time: '19:30', country: 'USD' },
    { id: '5', title: 'Unemployment Rate', impact: 'MEDIUM', time: '19:30', country: 'USD' },
    { id: '6', title: 'Empire State Manufacturing Index', impact: 'LOW', time: '20:30', country: 'USD' },
    { id: '7', title: 'ECB Monetary Policy Statement', impact: 'HIGH', time: '18:45', country: 'EUR' },
    { id: '8', title: 'Retail Sales m/m', impact: 'MEDIUM', time: '19:30', country: 'USD' },
];

export function useEconomicEvents() {
    const [events, setEvents] = useState<EconomicEvent[]>(MOCK_EVENTS);

    // In a real app, you would fetch this from an API like Finnhub or Investing
    const fetchEvents = async () => {
        // Placeholder for real API logic
        // const res = await fetch('...');
        setEvents(MOCK_EVENTS);
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 3600000); // Update every hour
        return () => clearInterval(interval);
    }, []);

    return { events };
}
