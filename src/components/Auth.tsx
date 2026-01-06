import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Lock, LogIn, Bitcoin, Zap, DollarSign, Dog, Wallet, Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface Bubble {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    symbol: string;
    change: number;
    color: 'green' | 'red';
    icon: React.ReactNode;
}

const COINS = [
    { symbol: 'BTC', name: 'Bitcoin', icon: <Bitcoin size={24} />, color: 'green' },
    { symbol: 'ETH', name: 'Ethereum', icon: <div className="font-black text-xs">ETH</div>, color: 'green' },
    { symbol: 'SOL', name: 'Solana', icon: <Zap size={20} />, color: 'red' },
    { symbol: 'BNB', name: 'Binance', icon: <Coins size={20} />, color: 'green' },
    { symbol: 'XRP', name: 'XRP', icon: <Wallet size={20} />, color: 'red' },
    { symbol: 'DOGE', name: 'Dogecoin', icon: <Dog size={24} />, color: 'green' },
    { symbol: 'USDT', name: 'Tether', icon: <DollarSign size={20} />, color: 'green' },
    { symbol: 'ADA', name: 'Cardano', icon: <Coins size={18} />, color: 'red' },
    { symbol: 'DOT', name: 'Polkadot', icon: <Coins size={18} />, color: 'green' },
    { symbol: 'LINK', name: 'Chainlink', icon: <div className="font-black text-[10px]">LINK</div>, color: 'green' },
    { symbol: 'MATIC', name: 'Polygon', icon: <Zap size={18} />, color: 'red' },
    { symbol: 'AVAX', name: 'Avalanche', icon: <TrendingUp size={20} />, color: 'green' },
];

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>();

    // Initialize bubbles
    useEffect(() => {
        const initialBubbles: Bubble[] = COINS.map((coin, index) => ({
            id: index,
            x: Math.random() * 80 + 10, // percentage
            y: Math.random() * 80 + 10, // percentage
            vx: (Math.random() - 0.5) * 0.05,
            vy: (Math.random() - 0.5) * 0.05,
            size: Math.random() * 60 + 80, // size in px
            symbol: coin.symbol,
            change: (Math.random() * 10 * (coin.color === 'green' ? 1 : -1)).toFixed(2) as any,
            color: coin.color as 'green' | 'red',
            icon: coin.icon,
        }));
        setBubbles(initialBubbles);
    }, []);

    // Animation Loop
    const animate = () => {
        setBubbles((prevBubbles) => {
            return prevBubbles.map((bubble) => {
                let newX = bubble.x + bubble.vx;
                let newY = bubble.y + bubble.vy;
                let newVX = bubble.vx;
                let newVY = bubble.vy;

                // Bounce off walls
                if (newX <= 0 || newX >= 100) newVX *= -1;
                if (newY <= 0 || newY >= 100) newVY *= -1;

                return {
                    ...bubble,
                    x: newX,
                    y: newY,
                    vx: newVX,
                    vy: newVY,
                };
            });
        });
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErr(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
        } catch (error: any) {
            setErr(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#050505] overflow-hidden">
            {/* Crypto Bubbles Background */}
            <div className="bubble-container" ref={containerRef}>
                {bubbles.map((bubble) => (
                    <div
                        key={bubble.id}
                        className={`crypto-bubble bubble-${bubble.color}`}
                        style={{
                            left: `${bubble.x}%`,
                            top: `${bubble.y}%`,
                            width: `${bubble.size}px`,
                            height: `${bubble.size}px`,
                            transform: `translate(-50%, -50%)`,
                        }}
                    >
                        <div className={`absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 bubble-glow-${bubble.color}`}></div>
                        <div className="bubble-content">
                            <div className="mb-1 opacity-80">{bubble.icon}</div>
                            <div className="bubble-symbol text-sm tracking-tighter" style={{ fontSize: `${bubble.size / 6}px` }}>
                                {bubble.symbol}
                            </div>
                            <div className="flex items-center gap-0.5 bubble-change" style={{ fontSize: `${bubble.size / 10}px` }}>
                                {bubble.color === 'green' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {bubble.change}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Login Card */}
            <div className="glass-morphism gold-glow max-w-md w-full p-8 rounded-2xl relative z-10 mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-gradient-to-br from-[var(--color-golden)] to-yellow-600 rounded-xl mb-4 shadow-lg shadow-yellow-500/20">
                        <ShieldCheck size={32} className="text-black" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">CRYPTO PORTAL</h2>
                    <p className="text-slate-400 text-sm">Hệ thống Trading Pro - Anh Duc Trader</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2 ml-1">
                            Email Truy Cập
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@email.com"
                                className="pl-10 w-full bg-slate-900/50 border border-slate-700/50 focus:border-[var(--color-golden)] focus:ring-1 focus:ring-[var(--color-golden)] transition-all rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2 ml-1">
                            Mật Khẩu
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pl-10 w-full bg-slate-900/50 border border-slate-700/50 focus:border-[var(--color-golden)] focus:ring-1 focus:ring-[var(--color-golden)] transition-all rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    {err && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center animate-pulse">
                            {err}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[var(--color-golden)] hover:bg-yellow-500 text-black font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <LogIn size={18} />
                                ĐĂNG NHẬP NGAY
                            </>
                        )}
                    </button>

                    <div className="pt-4 text-center">
                        <p className="text-[10px] text-slate-500 italic">
                            Chỉ dành cho tài khoản được cấp quyền.
                        </p>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-center w-full z-10 px-4">
                <p className="text-slate-600 text-[10px] tracking-widest uppercase">
                    © 2026 Anh Duc Trader • Secure Access Required
                </p>
            </div>
        </div>
    );
};
