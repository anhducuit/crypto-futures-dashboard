import React, { useState, useEffect } from 'react';
import { Building2, Clock, TrendingUp, TrendingDown, Activity, Target, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface KillzoneInfo {
    name: string;
    emoji: string;
    vnTime: string;
    isActive: boolean;
    canTrade: boolean;
    color: string;
}

interface ICTSignalData {
    id: string;
    symbol: string;
    strategy_name: string;
    direction: string;
    entry_price: number;
    created_at: string;
    status: string;
}

const KILLZONES: KillzoneInfo[] = [
    { name: 'Asia', emoji: '🔵', vnTime: '08:00–12:00', isActive: false, canTrade: false, color: 'blue' },
    { name: 'London', emoji: '🔴', vnTime: '14:00–17:00', isActive: false, canTrade: true, color: 'red' },
    { name: 'NY AM', emoji: '🟢', vnTime: '21:30–23:00', isActive: false, canTrade: true, color: 'green' },
    { name: 'NY Lunch', emoji: '🟡', vnTime: '00:00–01:00', isActive: false, canTrade: false, color: 'yellow' },
    { name: 'NY PM', emoji: '🟣', vnTime: '01:30–04:00', isActive: false, canTrade: false, color: 'purple' },
];

function getCurrentKillzone(): { current: KillzoneInfo | null; zones: KillzoneInfo[] } {
    const now = new Date();
    const t = now.getUTCHours() * 60 + now.getUTCMinutes();

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
    if (nextIdx === -1) nextIdx = 0;
    let diffMin = starts[nextIdx] - t;
    if (diffMin < 0) diffMin += 1440;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${names[nextIdx]} trong ${hours > 0 ? hours + 'h ' : ''}${mins}m`;
}

function formatPrice(p: number) {
    if (p < 1) return p.toFixed(6);
    if (p < 10) return p.toFixed(4);
    return p.toFixed(2);
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h trước`;
    return `${Math.floor(hours / 24)}d trước`;
}

export const ICTKillzonesPanel: React.FC = () => {
    const [kzData, setKzData] = useState(getCurrentKillzone());
    const [nextSession, setNextSession] = useState('');
    const [signals, setSignals] = useState<ICTSignalData[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch recent ICT signals from trading_history
    const fetchSignals = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('trading_history')
                .select('id, symbol, strategy_name, direction, entry_price, created_at, status')
                .like('strategy_name', '%ICT KILLZONES%')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setSignals(data);
        } catch (e) {
            console.error('Error fetching ICT signals:', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        const update = () => {
            const data = getCurrentKillzone();
            setKzData(data);
            if (!data.current) {
                setNextSession(getTimeUntilNext());
            }
        };
        update();
        fetchSignals();
        const kzInterval = setInterval(update, 30000);
        const sigInterval = setInterval(fetchSignals, 60000);
        return () => { clearInterval(kzInterval); clearInterval(sigInterval); };
    }, []);

    const { current, zones } = kzData;
    const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const vnTimeStr = vnNow.toISOString().slice(11, 16);

    return (
        <div className="card">
            <div className="card-header">
                <Building2 size={16} className="text-[var(--color-golden)]" />
                ICT KILLZONES + PIVOTS
                <button onClick={fetchSignals} className="ml-auto p-1 hover:bg-white/5 rounded" title="Refresh">
                    <RefreshCw size={12} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-4 space-y-3">
                {/* Current Killzone Status */}
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

                {/* Recent ICT Signals */}
                <div className="space-y-1">
                    <div className="text-[10px] font-bold text-[var(--color-golden)] uppercase tracking-wider mb-2">
                        🏦 Tín hiệu ICT gần nhất
                    </div>
                    {signals.length === 0 ? (
                        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-center">
                            <p className="text-[10px] text-gray-500">Chưa có tín hiệu ICT nào</p>
                            <p className="text-[9px] text-gray-600 mt-1">Bot sẽ nổ tín hiệu trong phiên London (14:00-17:00) hoặc NY AM (21:30-23:00)</p>
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {signals.map((sig) => (
                                <div
                                    key={sig.id}
                                    className={`flex items-center justify-between p-2 rounded-lg border ${
                                        sig.direction === 'LONG'
                                            ? 'bg-green-500/5 border-green-500/20'
                                            : 'bg-red-500/5 border-red-500/20'
                                    } ${sig.status === 'PENDING' ? 'animate-pulse' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {sig.direction === 'LONG'
                                            ? <ArrowUpRight size={14} className="text-green-400" />
                                            : <ArrowDownRight size={14} className="text-red-400" />
                                        }
                                        <div>
                                            <span className={`text-xs font-bold ${sig.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                                                {sig.direction}
                                            </span>
                                            <span className="text-[10px] text-white ml-1.5">{sig.symbol.replace('USDT', '')}</span>
                                            <span className={`ml-1.5 text-[9px] px-1 py-0.5 rounded ${
                                                sig.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400'
                                                : sig.status === 'WIN' ? 'bg-green-500/20 text-green-400'
                                                : sig.status === 'LOSS' ? 'bg-red-500/20 text-red-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                                {sig.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-[var(--color-text-primary)]">${formatPrice(sig.entry_price)}</div>
                                        <div className="text-[9px] text-gray-500">{timeAgo(sig.created_at)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Killzone Timeline */}
                <div className="space-y-1">
                    <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                        Lịch phiên giao dịch
                    </div>
                    {zones.map((kz) => (
                        <div
                            key={kz.name}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${kz.isActive
                                ? 'bg-white/5 border border-white/10'
                                : 'bg-[var(--color-bg-tertiary)]'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs">{kz.emoji}</span>
                                <span className={`text-[10px] font-medium ${kz.isActive ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                                    {kz.name}
                                </span>
                                {kz.canTrade && (
                                    <Target size={8} className={kz.isActive ? 'text-green-400' : 'text-gray-600'} />
                                )}
                            </div>
                            <span className={`text-[10px] ${kz.isActive ? 'text-white font-bold' : 'text-[var(--color-text-secondary)]'}`}>
                                {kz.vnTime}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ICT Strategy Mini-Guide */}
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
