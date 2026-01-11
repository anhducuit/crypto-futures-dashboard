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

            let mappedEvents: EconomicEvent[] = [];

            if (data.economicCalendar && data.economicCalendar.length > 0) {
                mappedEvents = data.economicCalendar
                    .filter((e: any) => ['USD', 'EUR', 'GBP', 'JPY'].includes(e.country))
                    .map((e: any, index: number) => {
                        const dateObj = new Date(e.time);
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
            } else {
                // FALLBACK: Generate mock events for the simulated 2026 year
                const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);
                const day3 = new Date(); day3.setDate(now.getDate() + 3);
                const fmtDate = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

                mappedEvents = [
                    { id: 'f1', title: 'Chỉ số Giá Tiêu dùng CPI (Mỹ)', impact: 'HIGH', time: '19:30', date: fmtDate(now), country: 'USD' },
                    { id: 'f2', title: 'Biên bản họp FOMC (Lãi suất)', impact: 'HIGH', time: '02:00', date: fmtDate(tomorrow), country: 'USD' },
                    { id: 'f3', title: 'Bảng lương Phi nông nghiệp (ADP)', impact: 'HIGH', time: '19:30', date: fmtDate(day3), country: 'USD' },
                    { id: 'f4', title: 'Tổng sản phẩm Quốc nội GDP (EU)', impact: 'MEDIUM', time: '16:00', date: fmtDate(now), country: 'EUR' },
                    { id: 'f5', title: 'Đơn trợ cấp Thất nghiệp (Mỹ)', impact: 'MEDIUM', time: '19:30', date: fmtDate(tomorrow), country: 'USD' },
                ];
            }

            const sorted = mappedEvents.sort((a, b) => {
                if (a.impact === 'HIGH' && b.impact !== 'HIGH') return -1;
                if (a.impact !== 'HIGH' && b.impact === 'HIGH') return 1;
                return 0;
            });

            setEvents(sorted);
        } catch (error) {
            console.error('Error fetching economic events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 3600000);
        return () => clearInterval(interval);
    }, [apiKey]);

    return { events, loading };
}
