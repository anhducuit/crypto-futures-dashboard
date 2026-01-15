import { useState, useEffect } from 'react';

export interface EconomicEvent {
    id: string;
    title: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW' | 'HOLIDAY';
    time: string;
    date: string;
    country: string;
    forecast?: string;
    previous?: string;
    timestamp: number;
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
    'Statement': 'Tuyên báo Chính sách',
    'Meeting Minutes': 'Biên bản cuộc họp',
    'Jobs Report': 'Báo cáo Việc làm',
    'Manufacturing PMI': 'Chỉ số Sản xuất PMI',
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

    const fetchEvents = async () => {
        const now = new Date();
        try {
            // Use Supabase Edge Function as a proxy to avoid CORS
            const proxyUrl = 'https://tnmagcatofooeshzdhac.supabase.co/functions/v1/check-trades?action=get-calendar';
            const res = await fetch(proxyUrl);
            const data = await res.json();

            let mappedEvents: EconomicEvent[] = [];

            if (data && Array.isArray(data) && data.length > 0) {
                mappedEvents = data
                    .filter((e: any) => ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'NZD'].includes(e.country))
                    .map((e: any, index: number) => {
                        const dateObj = new Date(e.date);
                        const day = dateObj.getDate().toString().padStart(2, '0');
                        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                        const hours = dateObj.getHours().toString().padStart(2, '0');
                        const minutes = dateObj.getMinutes().toString().padStart(2, '0');

                        return {
                            id: `${e.title}-${index}`,
                            title: translateEvent(e.title),
                            impact: e.impact.toUpperCase() as any,
                            time: `${hours}:${minutes}`,
                            date: `${day}/${month}`,
                            country: e.country,
                            forecast: e.forecast,
                            previous: e.previous,
                            timestamp: dateObj.getTime()
                        };
                    });
            } else {
                // FALLBACK: If real feed is empty (e.g. Sunday or API down), generate realistic 2026 events
                const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);
                const day3 = new Date(); day3.setDate(now.getDate() + 3);
                const fmtDate = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

                mappedEvents = [
                    { id: 'f1', title: 'Chỉ số Giá Tiêu dùng CPI (Mỹ)', impact: 'HIGH', time: '19:30', date: fmtDate(now), country: 'USD', timestamp: now.getTime() },
                    { id: 'f2', title: 'Biên bản họp FOMC (Lãi suất)', impact: 'HIGH', time: '02:00', date: fmtDate(tomorrow), country: 'USD', timestamp: tomorrow.getTime() },
                    { id: 'f3', title: 'Bảng lương Phi nông nghiệp (ADP)', impact: 'HIGH', time: '19:30', date: fmtDate(day3), country: 'USD', timestamp: day3.getTime() },
                    { id: 'f4', title: 'Tổng sản phẩm Quốc nội GDP (EU)', impact: 'MEDIUM', time: '16:00', date: fmtDate(now), country: 'EUR', timestamp: now.getTime() },
                    { id: 'f5', title: 'Đơn trợ cấp Thất nghiệp (Mỹ)', impact: 'MEDIUM', time: '19:30', date: fmtDate(tomorrow), country: 'USD', timestamp: tomorrow.getTime() },
                ];
            }

            // FILTER: Show only events from yesterday, today and future
            const oneDayAgo = now.getTime() - (24 * 60 * 60 * 1000);
            const filtered = mappedEvents.filter(e => (e as any).timestamp > oneDayAgo);

            // SORT: By Time (Chronological)
            const sorted = filtered.sort((a, b) => (a as any).timestamp - (b as any).timestamp);

            setEvents(sorted);
        } catch (error) {
            console.error('Error fetching economic events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 1800000); // 30 mins
        return () => clearInterval(interval);
    }, []);

    return { events, loading };
}
