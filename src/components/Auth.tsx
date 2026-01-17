import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Lock, LogIn, Zap, DollarSign, Dog, Wallet, Bitcoin, TrendingUp, TrendingDown, Coins, BarChart3 } from 'lucide-react';

interface Bubble {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    symbol: string;
    change: string;
    color: 'green' | 'red';
    icon: React.ReactNode;
}

const COINS = [
    { symbol: 'BTC', name: 'Bitcoin', icon: <Bitcoin size={24} />, color: 'green' },
    { symbol: 'ETH', name: 'Ethereum', icon: <div className="font-black text-xs">ETH</div>, color: 'green' },
    { symbol: 'SOL', name: 'Solana', icon: <Zap size={20} />, color: 'green' },
    { symbol: 'BNB', name: 'Binance', icon: <Coins size={20} />, color: 'green' },
    { symbol: 'XRP', name: 'XRP', icon: <Wallet size={20} />, color: 'green' },
    { symbol: 'DOGE', name: 'Dogecoin', icon: <Dog size={24} />, color: 'green' },
    { symbol: 'USDT', name: 'Tether', icon: <DollarSign size={20} />, color: 'green' },
    { symbol: 'ADA', name: 'Cardano', icon: <Coins size={18} />, color: 'green' },
    { symbol: 'LINK', name: 'Chainlink', icon: <div className="font-black text-[10px]">LINK</div>, color: 'green' },
    { symbol: 'MATIC', name: 'Polygon', icon: <Zap size={18} />, color: 'green' },
    { symbol: 'AVAX', name: 'Avalanche', icon: <TrendingUp size={20} />, color: 'green' },
    { symbol: 'DOT', name: 'Polkadot', icon: <Coins size={18} />, color: 'green' },
    { symbol: 'UNI', name: 'Uniswap', icon: <div className="font-black text-[10px]">UNI</div>, color: 'green' },
    { symbol: 'LTC', name: 'Litecoin', icon: <div className="font-black text-[10px]">LTC</div>, color: 'green' },
    { symbol: 'ATOM', name: 'Cosmos', icon: <Zap size={18} />, color: 'green' },
    { symbol: 'NEAR', name: 'NEAR Protocol', icon: <div className="font-black text-[10px]">NEAR</div>, color: 'green' },
    { symbol: 'ETC', name: 'Ethereum Classic', icon: <div className="font-black text-[10px]">ETC</div>, color: 'green' },
    { symbol: 'FIL', name: 'Filecoin', icon: <div className="font-black text-[10px]">FIL</div>, color: 'green' },
    { symbol: 'AAVE', name: 'Aave', icon: <div className="font-black text-[10px]">AAVE</div>, color: 'green' },
    { symbol: 'ALGO', name: 'Algorand', icon: <div className="font-black text-[10px]">ALGO</div>, color: 'green' },
    { symbol: 'XMR', name: 'Monero', icon: <div className="font-black text-[10px]">XMR</div>, color: 'green' },
    { symbol: 'EOS', name: 'EOS', icon: <div className="font-black text-[10px]">EOS</div>, color: 'green' },
    { symbol: 'XTZ', name: 'Tezos', icon: <div className="font-black text-[10px]">XTZ</div>, color: 'green' },
    { symbol: 'THETA', name: 'Theta', icon: <div className="font-black text-[10px]">THETA</div>, color: 'green' },
    { symbol: 'VET', name: 'VeChain', icon: <div className="font-black text-[10px]">VET</div>, color: 'green' },
    { symbol: 'SAND', name: 'The Sandbox', icon: <div className="font-black text-[10px]">SAND</div>, color: 'green' },
    { symbol: 'MANA', name: 'Decentraland', icon: <div className="font-black text-[10px]">MANA</div>, color: 'green' },
    { symbol: 'APE', name: 'ApeCoin', icon: <div className="font-black text-[10px]">APE</div>, color: 'green' },
    { symbol: 'QNT', name: 'Quant', icon: <div className="font-black text-[10px]">QNT</div>, color: 'green' },
];

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);
    const wsRef = useRef<WebSocket | null>(null);

    // Initialize bubbles
    useEffect(() => {
        const initialBubbles: Bubble[] = COINS.map((coin, index) => ({
            id: index,
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10,
            vx: (Math.random() - 0.5) * 0.05,
            vy: (Math.random() - 0.5) * 0.05,
            size: Math.random() * 60 + 80,
            symbol: coin.symbol,
            change: '0.00',
            color: 'green',
            icon: coin.icon,
        }));
        setBubbles(initialBubbles);

        // Setup WebSocket for Real-time Data
        const streams = COINS.map(c => `${c.symbol.toLowerCase()}usdt@ticker`).join('/');
        const wsUrl = `wss://fstream.binance.com/ws/${streams}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const symbol = data.s.replace('USDT', '');
                const changeP = parseFloat(data.P).toFixed(2);
                const isPositive = parseFloat(data.P) >= 0;

                setBubbles(prev => prev.map(b => {
                    if (b.symbol === symbol) {
                        return {
                            ...b,
                            change: changeP,
                            color: isPositive ? 'green' : 'red'
                        };
                    }
                    return b;
                }));
            } catch (e) {
                console.error('WS Error:', e);
            }
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const animate = () => {
        setBubbles((prevBubbles) => {
            return prevBubbles.map((bubble) => {
                let newX = bubble.x + bubble.vx;
                let newY = bubble.y + bubble.vy;
                let newVX = bubble.vx;
                let newVY = bubble.vy;

                if (newX <= 5 || newX >= 95) newVX *= -1;
                if (newY <= 5 || newY >= 95) newVY *= -1;

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
            <div className="bubble-container" ref={containerRef}>
                {bubbles.map((bubble) => (
                    <div
                        key={bubble.id}
                        className={`crypto-bubble bubble-${bubble.color} transition-colors duration-500`}
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

            <div className="glass-morphism gold-glow max-w-md w-full p-8 rounded-2xl relative z-10 mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-gradient-to-br from-[var(--color-golden)] to-yellow-600 rounded-xl mb-4 shadow-lg shadow-yellow-500/20">
                        <ShieldCheck size={32} className="text-black" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">CRYPTO PORTAL</h2>
                    <p className="text-slate-400 text-sm font-medium tracking-wide mb-6">Hệ thống Trading Pro - Anh Duc Trader</p>

                    <a
                        href="/intro"
                        className="group relative inline-flex items-center gap-3 px-6 py-3 bg-[var(--color-golden)]/10 border border-[var(--color-golden)]/30 rounded-2xl hover:bg-[var(--color-golden)]/20 transition-all duration-300 animate-pulse-slow shadow-[0_0_20px_rgba(255,184,0,0.1)]"
                    >
                        <BarChart3 size={20} className="text-[var(--color-golden)] group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-black text-[var(--color-golden)] uppercase tracking-[0.15em]">
                            Xem giới thiệu tính năng hệ thống
                        </span>
                        <div className="absolute -inset-1 bg-[var(--color-golden)] opacity-10 blur-lg rounded-2xl pointer-events-none group-hover:opacity-20 transition-opacity"></div>
                    </a>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wider">
                            Email truy cập
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--color-golden)] transition-colors" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@email.com"
                                className="pl-12 pr-4 py-3.5 w-full bg-[#08080a] border border-slate-800 focus:border-[var(--color-golden)] focus:ring-2 focus:ring-[var(--color-golden)]/10 transition-all rounded-xl text-white placeholder:text-slate-600 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wider">
                            Mật khẩu bảo mật
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--color-golden)] transition-colors" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pl-12 pr-4 py-3.5 w-full bg-[#08080a] border border-slate-800 focus:border-[var(--color-golden)] focus:ring-2 focus:ring-[var(--color-golden)]/10 transition-all rounded-xl text-white placeholder:text-slate-600 outline-none"
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

                    <div className="pt-4 text-center space-y-3">
                        <p className="text-[10px] text-slate-500 italic">
                            Chỉ dành cho tài khoản được cấp quyền.
                        </p>
                        <div className="border-t border-white/5 pt-3">
                            <a
                                href="/register"
                                className="text-xs font-bold text-[var(--color-golden)] hover:underline flex items-center justify-center gap-1"
                            >
                                <Zap size={14} />
                                CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ NGAY
                            </a>
                        </div>
                    </div>
                </form>
            </div>

            <div className="absolute bottom-6 text-center w-full z-10 px-4">
                <p className="text-slate-600 text-[10px] tracking-widest uppercase">
                    © 2026 Anh Duc Trader • Secure Access Required
                </p>
            </div>
        </div>
    );
};
