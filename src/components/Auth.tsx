import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Lock, LogIn, Zap, DollarSign, Dog, Wallet } from 'lucide-react';

// Using local assets generated
const BTC_ICON = 'C:/Users/PC/.gemini/antigravity/brain/4966686e-ef79-4119-9d2a-da79a6d44685/bitcoin_3d_icon_1767680227664.png';
const ETH_ICON = 'C:/Users/PC/.gemini/antigravity/brain/4966686e-ef79-4119-9d2a-da79a6d44685/ethereum_3d_icon_1767680249787.png';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState<string | null>(null);

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
        <div className="auth-bg min-h-screen flex items-center justify-center p-4">
            {/* Background Decorations - Floating 3D Icons and Coins */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* 3D Generated Icons */}
                <div className="absolute top-[10%] left-[15%] w-32 h-32 animate-float-slow opacity-40">
                    <img src={`file:///${BTC_ICON}`} alt="BTC" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                </div>
                <div className="absolute top-[20%] right-[15%] w-28 h-28 animate-float-medium opacity-40">
                    <img src={`file:///${ETH_ICON}`} alt="ETH" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                </div>

                {/* Styled CSS Coins */}
                {/* Solana */}
                <div className="absolute top-[60%] left-[8%] animate-float-fast opacity-30">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/20">
                        <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center border border-white/10">
                            <Zap className="text-purple-400" size={32} />
                            <span className="text-[10px] font-black text-white/80">SOL</span>
                        </div>
                    </div>
                </div>

                {/* USDT */}
                <div className="absolute bottom-[15%] right-[20%] animate-float-slow opacity-30">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 p-0.5 shadow-lg shadow-green-500/20">
                        <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center border border-white/10">
                            <DollarSign className="text-green-400" size={28} />
                            <span className="text-[10px] font-black text-white/80">USDT</span>
                        </div>
                    </div>
                </div>

                {/* DOGE */}
                <div className="absolute bottom-[25%] left-[20%] animate-float-medium opacity-20">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-400 p-0.5 shadow-lg shadow-yellow-500/20">
                        <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center border border-white/10">
                            <Dog className="text-yellow-500" size={32} />
                            <span className="text-[10px] font-black text-white/80">DOGE</span>
                        </div>
                    </div>
                </div>

                {/* XRP */}
                <div className="absolute top-[40%] right-[8%] animate-float-slow opacity-25">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-slate-400 p-0.5 shadow-lg shadow-blue-500/20">
                        <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center border border-white/10">
                            <Wallet className="text-blue-400" size={28} />
                            <span className="text-[10px] font-black text-white/80">XRP</span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-yellow-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Login Card */}
            <div className="glass-morphism gold-glow max-w-md w-full p-8 rounded-2xl relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-gradient-to-br from-[var(--color-golden)] to-yellow-600 rounded-xl mb-4 shadow-lg shadow-yellow-500/20">
                        <ShieldCheck size={32} className="text-black" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">PRO CRYPTO FUTURES</h1>
                    <p className="text-slate-400 text-sm">Hệ thống phân tích độc quyền của Anh Duc Trader</p>
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
                                className="pl-10 w-full bg-slate-900/50 border border-slate-700 focus:border-[var(--color-golden)] focus:ring-1 focus:ring-[var(--color-golden)] transition-all"
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
                                className="pl-10 w-full bg-slate-900/50 border border-slate-700 focus:border-[var(--color-golden)] focus:ring-1 focus:ring-[var(--color-golden)] transition-all"
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
                                ĐĂNG NHẬP HỆ THỐNG
                            </>
                        )}
                    </button>

                    <div className="pt-4 text-center">
                        <p className="text-[10px] text-slate-500 italic">
                            Hệ thống chỉ dành cho người dùng được cấp quyền.
                            Nếu chưa có tài khoản, vui lòng liên hệ Admin.
                        </p>
                    </div>
                </form>
            </div>

            {/* Attribution */}
            <div className="absolute bottom-8 text-center w-full z-10">
                <p className="text-slate-600 text-[10px] tracking-widest uppercase">
                    © 2026 Anh Duc Trader • Security Verified
                </p>
            </div>
        </div>
    );
};
