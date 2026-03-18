import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Activity, ExternalLink, Globe, Clock } from 'lucide-react';
import { useDexTrending } from '../hooks/useDexTrending';
import { type Language } from '../utils/translations';

interface DexTrendingPanelProps {
    language: Language;
}

// Custom Chain Icons for "PRO" feel
const ChainLogo: React.FC<{ chain: string }> = ({ chain }) => {
    const [error, setError] = React.useState(false);
    const chainLower = chain.toLowerCase();

    if (error) return <Globe size={10} className="text-white/20" />;

    let src = "";
    if (chainLower.includes('solana')) src = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png";
    else if (chainLower.includes('base')) src = "https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/base-symbol-logo.svg";
    else if (chainLower.includes('ethereum') || chainLower === 'eth') src = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
    else if (chainLower.includes('bsc') || chainLower.includes('bnb')) src = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png";

    if (!src) return <Globe size={10} className="text-white/20" />;

    return (
        <img 
            src={src} 
            className="w-3.5 h-3.5 object-contain" 
            alt={chain} 
            onError={() => setError(true)}
        />
    );
};

// Animated Number Component for "Jumping" effect
const PriceTicker: React.FC<{ value: string; isUsd?: boolean }> = ({ value, isUsd = true }) => {
    const [flash, setFlash] = useState<null | 'up' | 'down'>(null);
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value) {
            const up = parseFloat(value) > parseFloat(prevValue.current);
            setFlash(up ? 'up' : 'down');
            prevValue.current = value;
            const timer = setTimeout(() => setFlash(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [value]);

    return (
        <span className={`transition-all duration-500 font-mono font-black tracking-widest ${
            flash === 'up' ? 'text-green-400 scale-110' : 
            flash === 'down' ? 'text-red-400 scale-110' : 'text-white/90'
        }`}>
            {isUsd ? '$' : ''}{value}
        </span>
    );
};

export const DexTrendingPanel: React.FC<DexTrendingPanelProps> = () => {
    const { pairs, loading, error, refetch, lastUpdate } = useDexTrending();

    const formatCash = (n: number) => {
        if (n < 1e3) return n.toFixed(0);
        if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
        if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
        if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
        return +(n / 1e12).toFixed(1) + "T";
    };

    const getChainColor = (chainId: string) => {
        switch (chainId.toLowerCase()) {
            case 'solana': return 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]';
            case 'ethereum': return 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]';
            case 'base': return 'text-blue-500 bg-blue-600/10 border-blue-600/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]';
            case 'bsc': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]';
            case 'arbitrum': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="card flare-border shadow-2xl reveal relative overflow-hidden flex flex-col h-full min-h-[600px] bg-black/40 backdrop-blur-xl">
            {/* Cinematic Scanline & Glow Overlay */}
            <div className="absolute top-0 right-0 w-full h-[2px] bg-[var(--color-flare)]/30 animate-scan italic opacity-20 pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--color-flare)]/10 blur-[120px] pointer-events-none rounded-full"></div>

            <div className="card-header justify-between border-b border-white/10 pb-6 mb-2">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-flare)] to-orange-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative p-3 bg-black border border-white/10 rounded-xl">
                           <Activity size={20} className="text-[var(--color-flare)] animate-pulse" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-[1px] w-4 bg-[var(--color-flare)]"></span>
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-[var(--color-flare)] italic">Quantum_DexPulse</span>
                        </div>
                        <h2 className="text-xl font-black tracking-tighter uppercase text-white italic leading-none">MẠNG LƯỚI CHIẾN THẦN DEX</h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                            <div className="relative w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Data Sync</span>
                    </div>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className={`group p-2.5 bg-white/5 border border-white/10 text-white/50 hover:text-[var(--color-flare)] hover:border-[var(--color-flare)]/50 transition-all rounded-xl shadow-lg ${loading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar px-2">
                {loading && pairs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-[var(--color-flare)]/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-[var(--color-flare)] rounded-full animate-spin"></div>
                            <div className="absolute -inset-4 border border-[var(--color-flare)]/5 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-white uppercase tracking-[0.5em] italic opacity-50 mb-2">Architecting_Market_View...</span>
                            <div className="h-[2px] w-32 bg-white/5 overflow-hidden">
                                <div className="h-full bg-[var(--color-flare)] animate-progress w-full"></div>
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-40 text-red-400 gap-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                            <Activity size={32} className="opacity-40" />
                        </div>
                        <div className="text-center">
                            <span className="text-sm font-black uppercase tracking-[0.2em] mb-1 block">Vector Connection Failed</span>
                            <p className="text-[10px] font-mono text-red-400/50 uppercase">{error}</p>
                        </div>
                        <button onClick={refetch} className="px-6 py-2 bg-red-500/20 border border-red-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/40 transition-all">Reconnect_Now</button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Rank</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Asset Identification</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Current Price</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">24H Velocity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Trading Volume</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Liquidity Pool</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Deep Scan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {pairs.map((pair, idx) => {
                                if (!pair || !pair.baseToken) return null;
                                const h24Change = pair.priceChange?.h24 || 0;
                                const isPositive = h24Change >= 0;
                                const volumeH24 = pair.volume?.h24 || 0;
                                const liquidityUsd = pair.liquidity?.usd || 0;

                                return (
                                    <tr 
                                        key={`${pair.pairAddress}-${idx}`} 
                                        className="group hover:bg-[var(--color-flare)]/[0.03] transition-all duration-500 relative cursor-crosshair"
                                    >
                                        <td className="px-6 py-6 transition-all group-hover:pl-8">
                                            <span className="text-lg font-mono font-black italic text-white/10 group-hover:text-[var(--color-flare)]/40 transition-colors">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                     <div className="absolute -inset-1 bg-white/10 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                     <div className="relative w-10 h-10 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center p-0.5">
                                                         {pair.info?.imageUrl ? (
                                                             <img src={pair.info.imageUrl} className="w-full h-full object-cover rounded-full" alt="Icon" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                         ) : (
                                                             <div className="text-[10px] font-black text-[var(--color-flare)] italic">{pair.baseToken.symbol.slice(0, 1)}</div>
                                                         )}
                                                     </div>
                                                     <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center p-0.5 shadow-xl">
                                                        <ChainLogo chain={pair.chainId} />
                                                     </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-black italic tracking-tighter text-white group-hover:text-[var(--color-flare)] transition-colors">
                                                            {pair.baseToken.symbol}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">/ {pair.quoteToken.symbol}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-[2px] border text-[8px] font-black uppercase tracking-tighter ${getChainColor(pair.chainId)}`}>
                                                            {pair.chainId}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">{pair.dexId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <PriceTicker 
                                                value={pair.priceUsd ? (parseFloat(pair.priceUsd) < 0.0001 ? parseFloat(pair.priceUsd).toFixed(10) : parseFloat(pair.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })) : '0.00'} 
                                            />
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-[4px] border border-current bg-white/5 text-[10px] font-black italic tracking-widest ${isPositive ? 'text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}>
                                                {isPositive ? '+' : ''}{h24Change.toFixed(2)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-mono font-black text-white/90 tracking-widest whitespace-nowrap">${formatCash(volumeH24)}</span>
                                                <div className="w-16 h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                                                    <div className="h-full bg-[var(--color-flare)]/40 rounded-full" style={{ width: `${Math.min(100, (volumeH24 / 5000000) * 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-xs font-mono font-black text-white/50 tracking-tighter">
                                                ${liquidityUsd ? formatCash(liquidityUsd) : '0'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <a
                                                href={pair.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:text-black hover:bg-[var(--color-flare)] hover:border-[var(--color-flare)] hover:scale-105 transition-all shadow-xl group/btn"
                                            >
                                                SOi KÈO <ExternalLink size={12} className="group-hover/btn:rotate-12 transition-transform" />
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-2 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] opacity-30 italic">Matrix_Link: ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/20">
                        <Clock size={12} />
                        <span className="text-[9px] font-bold tracking-widest uppercase italic">
                            Last Sync: {new Date(lastUpdate).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <p className="text-[9px] text-[var(--color-silver)] font-medium italic uppercase tracking-widest opacity-20">
                        Signal_Entropy: 0.142ns  //  Protocol_V: 1.2.0-flare
                    </p>
                </div>
            </div>
        </div>
    );
};
