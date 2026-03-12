import React, { useState, useEffect } from 'react';
import { Building2, Clock, TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface KillzoneInfo {
    name: string;
    emoji: string;
    vnTime: string;
    utcTime: string;
    isActive: boolean;
    canTrade: boolean;
    color: string;
}

const KILLZONES: KillzoneInfo[] = [
    { name: 'Asia', emoji: '🔵', vnTime: '08:00–12:00', utcTime: '01:00–05:00', isActive: false, canTrade: false, color: 'blue' },
    { name: 'London', emoji: '🔴', vnTime: '14:00–17:00', utcTime: '07:00–10:00', isActive: false, canTrade: true, color: 'red' },
    { name: 'NY AM', emoji: '🟢', vnTime: '21:30–23:00', utcTime: '14:30–16:00', isActive: false, canTrade: true, color: 'green' },
    { name: 'NY Lunch', emoji: '🟡', vnTime: '00:00–01:00', utcTime: '17:00–18:00', isActive: false, canTrade: false, color: 'yellow' },
    { name: 'NY PM', emoji: '🟣', vnTime: '01:30–04:00', utcTime: '18:30–21:00', isActive: false, canTrade: false, color: 'purple' },
];

function getCurrentKillzone(): { current: KillzoneInfo | null; zones: KillzoneInfo[] } {
    const now = new Date();
    const utcH = now.getUTCHours();
    const t = utcH * 60 + now.getUTCMinutes();

    const zones = KILLZONES.map(kz => {
        let isActive = false;
        if (kz.name === 'Asia' && t >= 60 && t < 300) isActive = true;
        if (kz.name === 'London' && t >= 420 && t < 600) isActive = true;
        if (kz.name === 'NY AM' && t >= 870 && t < 960) isActive = true;
        if (kz.name === 'NY Lunch' && t >= 1020 && t < 1080) isActive = true;
        if (kz.name === 'NY PM' && t >= 1110 && t < 1260) isActive = true;
        return { ...kz, isActive };
    });

    return { current: zones.find(z => z.isActive) || null, zones };
}

function getTimeUntilNext(): string {
    const now = new Date();
    const t = now.getUTCHours() * 60 + now.getUTCMinutes();

    const starts = [60, 420, 870, 1020, 1110];
    const names = ['Asia', 'London', 'NY AM', 'NY Lunch', 'NY PM'];

    let nextIdx = starts.findIndex(s => s > t);
    if (nextIdx === -1) nextIdx = 0; // wrap to next day

    const nextStart = starts[nextIdx];
    let diffMin = nextStart - t;
    if (diffMin < 0) diffMin += 1440;

    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;

    return `${names[nextIdx]} trong ${hours > 0 ? hours + 'h ' : ''}${mins}m`;
}

export const ICTKillzonesPanel: React.FC = () => {
    const [kzData, setKzData] = useState(getCurrentKillzone());
    const [nextSession, setNextSession] = useState('');

    useEffect(() => {
        const update = () => {
            const data = getCurrentKillzone();
            setKzData(data);
            if (!data.current) {
                setNextSession(getTimeUntilNext());
            }
        };
        update();
        const interval = setInterval(update, 30000);
        return () => clearInterval(interval);
    }, []);

    const { current, zones } = kzData;

    const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const vnTimeStr = vnNow.toISOString().slice(11, 16);

    return (
        <div className="card">
            <div className="card-header">
                <Building2 size={16} className="text-[var(--color-golden)]" />
                ICT KILLZONES + PIVOTS
            </div>

            <div className="p-4 space-y-3">
                {/* Current Status */}
                <div className={`p-3 rounded-lg border ${current
                    ? current.canTrade
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-gray-500/10 border-gray-500/30'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {current ? (
                                current.canTrade
                                    ? <TrendingUp size={16} className="text-green-400" />
                                    : <Activity size={16} className="text-blue-400" />
                            ) : (
                                <Clock size={16} className="text-gray-400" />
                            )}
                            <div>
                                <span className={`text-sm font-bold ${current
                                    ? current.canTrade ? 'text-green-400' : 'text-blue-400'
                                    : 'text-gray-400'
                                }`}>
                                    {current
                                        ? `${current.emoji} ${current.name.toUpperCase()}`
                                        : '⚪ NGOÀI PHIÊN'
                                    }
                                </span>
                                {current && current.canTrade && (
                                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                        TRADE ZONE
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                            {vnTimeStr} VN
                        </span>
                    </div>
                    {!current && (
                        <p className="text-[10px] text-gray-500 mt-1">⏳ {nextSession}</p>
                    )}
                </div>

                {/* Killzone Timeline */}
                <div className="space-y-1">
                    {zones.map((kz) => (
                        <div
                            key={kz.name}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${kz.isActive
                                ? `bg-${kz.color}-500/15 border border-${kz.color}-500/30`
                                : 'bg-[var(--color-bg-tertiary)]'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{kz.emoji}</span>
                                <span className={`text-xs font-medium ${kz.isActive ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                                    {kz.name}
                                </span>
                                {kz.canTrade && (
                                    <Target size={10} className={kz.isActive ? 'text-green-400' : 'text-gray-600'} />
                                )}
                            </div>
                            <span className={`text-[10px] ${kz.isActive ? 'text-white font-bold' : 'text-[var(--color-text-secondary)]'}`}>
                                {kz.vnTime}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ICT Strategy Explanation */}
                <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-2">
                    <div className="text-[10px] font-bold text-[var(--color-golden)] uppercase tracking-wider">
                        Chiến lược ICT
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-green-500/5 rounded border border-green-500/10">
                            <div className="flex items-center gap-1 mb-1">
                                <TrendingUp size={10} className="text-green-400" />
                                <span className="text-[10px] text-green-400 font-bold">LONG</span>
                            </div>
                            <p className="text-[9px] text-gray-500 leading-relaxed">
                                Sweep Asia Low → Rejection → Giá đóng trên Asia Low
                            </p>
                        </div>
                        <div className="p-2 bg-red-500/5 rounded border border-red-500/10">
                            <div className="flex items-center gap-1 mb-1">
                                <TrendingDown size={10} className="text-red-400" />
                                <span className="text-[10px] text-red-400 font-bold">SHORT</span>
                            </div>
                            <p className="text-[9px] text-gray-500 leading-relaxed">
                                Sweep Asia High → Rejection → Giá đóng dưới Asia High
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)] pt-2">
                    <span className="text-green-400">●</span> Trade Zone (London, NY AM) — 
                    <span className="text-blue-400"> ●</span> Range Zone (Asia) — 
                    <span className="text-gray-500"> ●</span> Chop Zone (NY Lunch)
                </div>
            </div>
        </div>
    );
};
