import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [txCode, setTxCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignupInitiate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Generate a random high-quality unique code for transaction matching
            const generatedCode = `REG-${Math.floor(1000 + Math.random() * 9000)}`;
            setTxCode(generatedCode);

            const { error: regError } = await supabase
                .from('user_registrations')
                .insert([{
                    email,
                    password_hash: password,
                    tx_code: generatedCode,
                    payment_status: 'pending'
                }]);

            if (regError) throw regError;
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi khởi tạo đăng ký');
        } finally {
            setLoading(false);
        }
    };

    // Polling logic for status check
    React.useEffect(() => {
        let interval: any;
        if (step === 2 && email) {
            interval = setInterval(async () => {
                const { data } = await supabase
                    .from('user_registrations')
                    .select('payment_status')
                    .eq('email', email)
                    .single();

                if (data?.payment_status === 'completed') {
                    setStep(3);
                }
            }, 3000); // Check every 3s
        }
        return () => clearInterval(interval);
    }, [step, email]);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#1a1c24] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">

                {/* Header Section */}
                <div className="p-8 text-center bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
                    <div className="w-16 h-16 bg-[var(--color-golden)] rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg shadow-[var(--color-golden)]/20">
                        <ShieldCheck className="text-black" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                        Kích hoạt Tài khoản <span className="text-[var(--color-golden)]">PRO</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Bạn cần thanh toán phí duy trì hệ thống là 10$ (~250.000đ)</p>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <form onSubmit={handleSignupInitiate} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Email Đăng ký</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--color-golden)] transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--color-golden)] transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">{error}</div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[var(--color-golden)] to-[#d4af37] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[var(--color-golden)]/20 disabled:opacity-50 mt-4"
                            >
                                {loading ? 'ĐANG XỬ LÝ...' : 'TIẾP TỤC THANH TOÁN'}
                                <ArrowRight size={20} />
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="text-center space-y-6">
                            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-2xl">
                                <img
                                    src={`https://img.vietqr.io/image/MB-208999999999-compact2.png?amount=250000&addInfo=${txCode}&accountName=TRAN%20ANH%20DUC`}
                                    alt="VietQR Thanh Toán"
                                    className="w-64 h-auto rounded-lg"
                                />
                                <div className="mt-2 flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                                    <span className="text-[10px] font-black text-black uppercase">QUÉT ĐỂ THANH TOÁN TỰ ĐỘNG</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nội dung chuyển khoản (Bắt buộc)</p>
                                <div className="bg-[var(--color-golden)]/10 border border-[var(--color-golden)]/20 rounded-xl py-3 px-6 inline-block">
                                    <span className="text-xl font-black text-[var(--color-golden)] tracking-widest">{txCode}</span>
                                </div>
                                <p className="text-[10px] text-red-400 font-bold uppercase mt-2 italic">⚠️ Lưu ý: Hệ thống duyệt tự động dựa trên mã này</p>
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <p className="text-xs text-slate-400">Sau khi chuyển khoản, hệ thống sẽ tự động kích hoạt tài khoản và gửi thông báo qua Telegram/Email cho bạn.</p>
                                <div className="flex items-center justify-center gap-2 text-[var(--color-golden)] animate-pulse">
                                    <div className="w-2 h-2 bg-[var(--color-golden)] rounded-full"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Đang chờ thanh toán...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-lg shadow-green-500/10">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase italic">THÀNH CÔNG!</h2>
                            <p className="text-slate-400 text-xs mt-4 leading-relaxed">Tài khoản của bạn đã được kích hoạt. Hãy kiểm tra Telegram hoặc Email để nhận thông báo truy cập.</p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full mt-8 bg-white text-black font-black py-4 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-tighter"
                            >
                                ĐĂNG NHẬP NGAY
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="bg-black/20 p-4 border-t border-white/5 text-[9px] text-slate-600 font-bold text-center tracking-widest uppercase">
                    Secured by Anh Duc Trading System • 2026
                </div>
            </div>
        </div>
    );
};
