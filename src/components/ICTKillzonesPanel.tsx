import React, { useState, useEffect } from 'react';
import { Building2, Clock, TrendingUp, Activity, Target, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation, type Language } from '../utils/translations';

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

function getTimeUntilNext(t: (key: string, param?: string) => string): string {
    const now = new Date();
    const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    const starts = [60, 420, 870, 1020, 1110];
    const names = ['Asia', 'London', 'NY AM', 'NY Lunch', 'NY PM'];
    let nextIdx = starts.findIndex(s => s > utcMin);
    if (nextIdx === -1) nextIdx = 0;
    let diffMin = starts[nextIdx] - utcMin;
    if (diffMin < 0) diffMin += 1440;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${names[nextIdx]} ${t('time_until_prefix')} ${hours > 0 ? hours + 'h ' : ''}${mins}m`;
}

function formatPrice(p: number) {
    if (p < 1) return p.toFixed(6);
    if (p < 10) return p.toFixed(4);
    return p.toFixed(2);
}

function timeAgo(dateStr: string, t: any): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('ago');
    if (mins < 60) return `${mins}${t('mins_ago')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t('hours_ago')}`;
    return `${Math.floor(hours / 24)}${t('days_ago')}`;
}

interface ICTKillzonesPanelProps {
    language: Language;
}

export const ICTKillzonesPanel: React.FC<ICTKillzonesPanelProps> = ({ language }) => {
    const t = useTranslation(language);
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
                setNextSession(getTimeUntilNext(t as any));
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
            <div className="card-header border-b border-[var(--color-border)] pb-2">
                <Building2 size={16} className="text-[var(--color-flare)]" />
                <span className="font-black tracking-[0.2em] uppercase">{t('ict_killzones_title')}</span>
                <button onClick={fetchSignals} className="ml-auto p-2 hover:bg-white/5 transition-colors rounded-[2px]" title="Refresh">
                    <RefreshCw size={12} className={`text-[var(--color-silver)] ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-2 space-y-1.5">
                {/* Current Killzone Status */}
                <div className={`p-3 rounded-[1px] border transition-all duration-500 ${current
                    ? current.canTrade
                        ? 'bg-[var(--color-long)]/5 border-[var(--color-long)]/30 shadow-[0_0_20px_rgba(0,255,163,0.05)]'
                        : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)]'
                    : 'bg-black/20 border-white/5 opacity-60'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-[1px] ${current ? (current.canTrade ? 'bg-[var(--color-long)]/20' : 'bg-white/5') : 'bg-white/5'}`}>
                                {current ? (
                                    current.canTrade
                                        ? <TrendingUp size={16} className="text-[var(--color-long)]" />
                                        : <Activity size={16} className="text-[var(--color-silver)]" />
                                ) : (
                                    <Clock size={16} className="text-white/20" />
                                )}
                            </div>
                            <div>
                                <div className={`text-[11px] font-black uppercase tracking-widest ${current
                                    ? current.canTrade ? 'text-[var(--color-long)]' : 'text-white'
                                    : 'text-white/20'
                                }`}>
                                    {current
                                        ? `${current.emoji} ${current.name.toUpperCase()}`
                                        : `⚪ ${t('outside_session')}`
                                    }
                                </div>
                                {current && current.canTrade && (
                                    <div className="text-[9px] font-black text-[var(--color-long)] opacity-50 uppercase tracking-tighter mt-0.5">
                                        {t('trade_zone')}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] font-black text-[var(--color-silver)] opacity-40 uppercase tracking-widest mb-1 italic">{t('protocol')} VN</div>
                             <div className="text-xs font-black text-white font-mono tracking-widest">{vnTimeStr}</div>
                        </div>
                    </div>
                    {!current && (
                        <div className="mt-2 pt-2 border-t border-white/5 animate-pulse">
                            <p className="text-[10px] font-black text-[var(--color-silver)] italic tracking-widest uppercase opacity-40">⏳ {nextSession}</p>
                        </div>
                    )}
                </div>

                {/* Recent ICT Signals - Slimmed Down */}
                <div className="space-y-1">
                    <div className="text-[10px] font-black text-[var(--color-flare)] uppercase tracking-[0.3em] italic mb-2 opacity-50">
                        {t('recent_ict_signals')}
                    </div>
                    {signals.length === 0 ? (
                        <div className="p-6 bg-black/20 border border-white/5 rounded-[1px] text-center">
                            <p className="text-[10px] font-black text-[var(--color-silver)] uppercase tracking-widest opacity-20 mb-2">{t('no_ict_signals')}</p>
                            <p className="text-[9px] text-[var(--color-silver)] italic opacity-40 leading-relaxed max-w-[200px] mx-auto">{t('ict_signals_desc')}</p>
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-[100px] overflow-y-auto no-scrollbar">
                            {signals.map((sig) => (
                                <div
                                    key={sig.id}
                                    className={`flex items-center justify-between p-2 rounded-[1px] border transition-all duration-300 hover:bg-white/[0.02] ${
                                        sig.direction === 'LONG'
                                            ? 'bg-[var(--color-long)]/5 border-[var(--color-long)]/10 hover:border-[var(--color-long)]/30'
                                            : 'bg-[var(--color-short)]/5 border-[var(--color-short)]/10 hover:border-[var(--color-short)]/30'
                                    } ${sig.status === 'PENDING' ? 'animate-pulse' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-[1px] ${sig.direction === 'LONG' ? 'bg-[var(--color-long)]/20' : 'bg-[var(--color-short)]/20'}`}>
                                            {sig.direction === 'LONG'
                                                ? <ArrowUpRight size={14} className="text-[var(--color-long)]" />
                                                : <ArrowDownRight size={14} className="text-[var(--color-short)]" />
                                            }
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[10px] font-black tracking-widest italic ${sig.direction === 'LONG' ? 'text-[var(--color-long)]' : 'text-[var(--color-short)]'}`}>
                                                    {sig.direction}
                                                </span>
                                                <span className="text-[11px] font-black text-white italic tracking-widest">{sig.symbol.replace('USDT', '')}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-[1px] uppercase tracking-tighter ${
                                                    sig.status === 'PENDING' ? 'bg-[var(--color-flare)]/20 text-[var(--color-flare)]'
                                                    : sig.status === 'SUCCESS' ? 'bg-[var(--color-long)]/20 text-[var(--color-long)]'
                                                    : sig.status === 'FAILED' ? 'bg-[var(--color-short)]/20 text-[var(--color-short)]'
                                                    : 'bg-white/5 text-[var(--color-silver)]'
                                                }`}>
                                                    {sig.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-white font-mono tracking-widest mb-0.5">${formatPrice(sig.entry_price)}</div>
                                        <div className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-widest opacity-30 italic">{timeAgo(sig.created_at, t)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Killzone Timeline */}
                <div className="space-y-2">
                    <div className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] opacity-30 italic mb-1">
                        TIMELINE
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                        {zones.map((kz) => (
                            <div
                                key={kz.name}
                                className={`flex items-center justify-between px-2 py-1 rounded-[1px] border transition-all duration-500 ${kz.isActive
                                    ? 'bg-[var(--color-bg-tertiary)] border-[var(--color-flare)]/40 shadow-[0_0_15px_rgba(255,77,0,0.05)]'
                                    : 'bg-black/10 border-white/5 opacity-40'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm">{kz.emoji}</span>
                                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase italic ${kz.isActive ? 'text-white' : 'text-[var(--color-silver)]'}`}>
                                        {kz.name}
                                    </span>
                                    {kz.canTrade && (
                                        <Target size={10} className={kz.isActive ? 'text-[var(--color-long)]' : 'text-white/10'} />
                                    )}
                                </div>
                                <span className={`text-[10px] font-black font-mono tracking-widest ${kz.isActive ? 'text-[var(--color-flare)]' : 'text-white/20'}`}>
                                    {kz.vnTime}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
