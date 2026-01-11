import { useState, useEffect } from 'react';

export interface EconomicEvent {
    id: string;
    title: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    time: string;
    date: string;
    country: string;
}

const MOCK_EVENTS: EconomicEvent[] = [
    { id: '1', title: 'Chỉ số Giá Tiêu dùng CPI (Mỹ)', impact: 'HIGH', time: '19:30', date: '15/01', country: 'USD' },
    { id: '2', title: 'CPI Lõi hàng tháng (Mỹ)', impact: 'HIGH', time: '19:30', date: '15/01', country: 'USD' },
    { id: '3', title: 'Biên bản họp FOMC (Lãi suất)', impact: 'HIGH', time: '02:00', date: '16/01', country: 'USD' },
    { id: '4', title: 'Bảng lương Phi nông nghiệp (ADP)', impact: 'HIGH', time: '19:30', date: '17/01', country: 'USD' },
    { id: '5', title: 'Tỷ lệ Thất nghiệp (Mỹ)', impact: 'MEDIUM', time: '19:30', date: '17/01', country: 'USD' },
    { id: '6', title: 'Chỉ số Sản xuất Empire State', impact: 'LOW', time: '20:30', date: '18/01', country: 'USD' },
    { id: '7', title: 'Tuyên bố Chính sách Tiền tệ ECB', impact: 'HIGH', time: '18:45', date: '19/01', country: 'EUR' },
    { id: '8', title: 'Doanh số Bán lẻ hàng tháng', impact: 'MEDIUM', time: '19:30', date: '20/01', country: 'USD' },
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
