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
        try {
            // Source: ForexFactory Public JSON Feed (Keyless)
            const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
            const data = await response.json();

            if (Array.isArray(data)) {
                const mappedEvents: EconomicEvent[] = data
                    .filter((e: any) => ['USD', 'EUR', 'GBP', 'JPY', 'CNY'].includes(e.country))
                    .map((e: any, index: number) => {
                        // Parse ISO date (e.g. "2026-01-05T10:00:00-05:00")
                        const dateObj = new Date(e.date);

                        // Format for Vietnam Time (Browser will handle based on local settings, 
                        // but let's be explicit if needed. Since App is in VN, standard Date is fine)
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
                            previous: e.previous
                        };
                    });

                // Prioritize High Impact, then Sort by Time
                const sorted = mappedEvents.sort((a, b) => {
                    const impactWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'HOLIDAY': 0 };
                    const weightA = impactWeight[a.impact] || 0;
                    const weightB = impactWeight[b.impact] || 0;

                    if (weightA !== weightB) return weightB - weightA;
                    return 0; // Keep original chronological order for same impact
                });

                setEvents(sorted);
            }
        } catch (error) {
            console.error('Error fetching economic events from Faireconomy:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 3600000); // Refresh hourly
        return () => clearInterval(interval);
    }, []);

    return { events, loading };
}
