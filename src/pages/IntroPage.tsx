import React from 'react';
import {
    Zap,
    Shield,
    BarChart3,
    Globe,
    ArrowRight,
    CheckCircle2,
    Clock,
    Award
} from 'lucide-react';

const IntroPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans selection:bg-[var(--color-golden)]/30">
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 px-4 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,_var(--color-golden)_0%,_transparent_70%)] opacity-5 blur-[120px] pointer-events-none"></div>

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
                        <Award className="w-4 h-4 text-[var(--color-golden)]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Hệ thống Trading AI hàng đầu 2026</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                        Giao dịch thông minh hơn với <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-golden)] to-yellow-200">
                            Công nghệ AI Real-time
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Hệ thống tự động quét thị trường 24/7, cung cấp tín hiệu chính xác với các chỉ báo kỹ thuật nâng cao và bộ lọc rủi ro thông minh.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => window.location.href = '/register'}
                            className="w-full md:w-auto px-8 py-4 bg-[var(--color-golden)] text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,184,0,0.3)]"
                        >
                            ĐĂNG KÝ NGAY <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full md:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all"
                        >
                            ĐĂNG NHẬP
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 bg-black/20">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[var(--color-golden)]/30 transition-all group">
                            <div className="w-14 h-14 bg-[var(--color-golden)]/10 rounded-2xl flex items-center justify-center mb-6 border border-[var(--color-golden)]/20 group-hover:scale-110 transition-transform">
                                <Zap className="w-7 h-7 text-[var(--color-golden)]" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Tín hiệu Real-time 24/7</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Robot quét liên tục các khung thời gian 1m, 15m, 1h, 4h để tìm điểm vào lệnh tốt nhất theo tiêu chuẩn MA, RSI và Fibonacci.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[var(--color-golden)]/30 transition-all group">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Phân tích chuyên sâu</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Xem dữ liệu lịch sử độ chính xác (Accuracy), xu hướng thị trường Binance Futures và các chỉ báo Market Trends trực quan.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[var(--color-golden)]/30 transition-all group">
                            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20 group-hover:scale-110 transition-transform">
                                <Globe className="w-7 h-7 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Lịch kinh tế tự động</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Cập nhật các sự kiến kinh tế quan trọng ngay trên giao diện, giúp bạn tránh né các thời điểm thị trường biến động cực mạnh.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Showcase Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <h2 className="text-4xl font-black mb-8 leading-tight">
                            Quản lý rủi ro tuyệt đối với <br className="hidden md:block" />
                            <span className="text-[var(--color-golden)]">Dynamic TP & SL</span>
                        </h2>
                        <ul className="space-y-6">
                            {[
                                "Tính toán vùng chốt lời dựa trên Fibonacci Retracement",
                                "Stoploss linh hoạt theo ATR và biến động thị trường",
                                "Robot tự động lọc nhiễu, chống Spike giá râu dài",
                                "Thông báo tức thì qua Telegram cho mỗi tín hiệu"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-[var(--color-golden)] shrink-0" />
                                    <span className="text-slate-300 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1 w-full max-w-md">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-golden)] to-orange-600 rounded-3xl blur opacity-20"></div>
                            <div className="relative bg-[#1a1c24] border border-white/10 rounded-3xl p-8 overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bot Status: Active</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--color-golden)] w-[75%]"></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                            <div className="text-[10px] text-slate-500 font-bold mb-1">WIN RATE</div>
                                            <div className="text-xl font-black text-green-400">76%</div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                            <div className="text-[10px] text-slate-500 font-bold mb-1">TOTAL SIGNALS</div>
                                            <div className="text-xl font-black text-white">1,240+</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 px-4 text-center bg-[radial-gradient(ellipse_at_bottom,_var(--color-golden)_0%,_transparent_60%)] opacity-20">
                <div className="max-w-3xl mx-auto border-t border-white/5 pt-16">
                    <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                        Sẵn sàng nâng tầm giao dịch của bạn?
                    </h2>
                    <p className="text-lg text-slate-400 mb-12">
                        Gia nhập cộng đồng 500+ Traders đang sử dụng hệ thống của Anh Duc Trader để tối ưu hóa lợi nhuận mỗi ngày.
                    </p>
                    <button
                        onClick={() => window.location.href = '/register'}
                        className="group px-12 py-5 bg-white text-black font-black rounded-2xl inline-flex items-center gap-3 hover:bg-[var(--color-golden)] transition-all transform hover:-translate-y-1"
                    >
                        BẮT ĐẦU NGAY BÂY GIỜ <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="mt-8 flex items-center justify-center gap-6 text-slate-500">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
                            <Shield className="w-4 h-4" /> Bảo mật 100%
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
                            <Clock className="w-4 h-4" /> Hỗ trợ 24/7
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center text-slate-600 text-[10px] font-bold tracking-widest uppercase mb-4">
                © 2026 Developed by Anh Duc Trader. All rights reserved.
            </footer>
        </div>
    );
};

export default IntroPage;
