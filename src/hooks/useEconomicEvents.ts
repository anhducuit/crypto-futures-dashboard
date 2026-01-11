import { useState, useEffect } from 'react';

export interface EconomicEvent {
    id: string;
    title: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    time: string;
    date: string;
    country: string;
    actual?: number | null;
    estimate?: number | null;
    prev?: number | null;
}

const TRANSLATIONS: Record<string, string> = {
    'CPI': 'Chỉ số Giá Tiêu dùng (CPI)',
    'Core CPI': 'CPI Lõi',
    'FOMC': 'Hội nghị FOMC (Lãi suất)',
    'Non-Farm': 'Bảng lương Phi nông nghiệp',
    'Unemployment Rate': 'Tỷ lệ Thất nghiệp',
    'GDP': 'Tổng sản phẩm Quốc nội (GDP)',
    'Retail Sales': 'Doanh số Bán lẻ',
    'Initial Jobless Claims': 'Đơn trợ cấp Thất nghiệp',
    'PPI': 'Chỉ số Giá Sản xuất (PPI)',
    'Consumer Confidence': 'Niềm tin Tiêu dùng',
    'Interest Rate': 'Quyết định Lãi suất',
    'Statement': 'Tuyên bố Chính sách',
    'Meeting Minutes': 'Biên bản cuộc họp',
};

function translateEvent(event: string): string {
    for (const [key, value] of Object.entries(TRANSLATIONS)) {
        if (event.includes(key)) return event.replace(key, value);
    }
    return event;
}

export function useEconomicEvents() {
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;

    const fetchEvents = async () => {
        if (!apiKey) return;

        try {
            const now = new Date();
            const from = now.toISOString().split('T')[0];
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);
            const to = nextWeek.toISOString().split('T')[0];

            const response = await fetch(
                `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`
            );
            const data = await response.json();

            if (data.economicCalendar) {
                const mappedEvents: EconomicEvent[] = data.economicCalendar
                    .filter((e: any) => ['USD', 'EUR', 'GBP', 'JPY'].includes(e.country)) // Focus on major movers
                    .map((e: any, index: number) => {
                        const dateObj = new Date(e.time);
                        // Convert to Vietnam Time (UTC+7)
                        const vnTime = new Date(dateObj.getTime());

                        const day = vnTime.getDate().toString().padStart(2, '0');
                        const month = (vnTime.getMonth() + 1).toString().padStart(2, '0');
                        const hours = vnTime.getHours().toString().padStart(2, '0');
                        const minutes = vnTime.getMinutes().toString().padStart(2, '0');

                        return {
                            id: `${e.event}-${index}`,
                            title: translateEvent(e.event),
                            impact: (e.impact === 'high' ? 'HIGH' : e.impact === 'medium' ? 'MEDIUM' : 'LOW') as any,
                            time: `${hours}:${minutes}`,
                            date: `${day}/${month}`,
                            country: e.country,
                            actual: e.actual,
                            estimate: e.estimate,
                            prev: e.prev
                        };
                    });

                // Sort by time: High impact first, then by date/time
                const sorted = mappedEvents.sort((a, b) => {
                    if (a.impact === 'HIGH' && b.impact !== 'HIGH') return -1;
                    if (a.impact !== 'HIGH' && b.impact === 'HIGH') return 1;
                    return 0;
                });

                setEvents(sorted);
            }
        } catch (error) {
            console.error('Error fetching economic events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 3600000); // Hourly
        return () => clearInterval(interval);
    }, [apiKey]);

    return { events, loading };
}
