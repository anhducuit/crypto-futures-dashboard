import React from 'react';
import { Clock } from 'lucide-react';

interface GoldenHourAnalysisProps {
    bestHours: Record<string, { wins: number, losses: number }>;
    strategyStats: Record<string, { wins: number, losses: number }>;
}

export const GoldenHourAnalysis: React.FC<GoldenHourAnalysisProps> = ({ bestHours, strategyStats }) => {
    return (
        <div className="card">
            <div className="card-header flex justify-between items-center bg-[var(--color-bg-secondary)] p-4">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[var(--color-golden)]" />
                    <span className="font-bold tracking-tight uppercase">PHÂN TÍCH GIỜ VÀNG VÀ CHIẾN LƯỢC</span>
                </div>
            </div>
            
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(bestHours).map(([session, counts]) => {
                    const total = counts.wins + counts.losses;
                    const rate = total > 0 ? (counts.wins / total * 100) : 0;
                    return (
                        <div key={session} className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">{session}</p>
                            <p className={`text-lg font-black ${rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{rate.toFixed(0)}%</p>
                            <div className="mt-2 text-[10px] flex justify-center gap-2">
                                <span className="text-green-500">W:{counts.wins}</span>
                                <span className="text-red-500">L:{counts.losses}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-[var(--color-border)]">
                <h3 className="text-xs font-bold text-[var(--color-golden)] mb-3 uppercase tracking-wider">Hiệu Suất 5 Chiến Lược Combo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    {Object.entries(strategyStats).map(([strategy, counts]) => {
                        const total = counts.wins + counts.losses;
                        const rate = total > 0 ? (counts.wins / total * 100) : 0;
                        return (
                            <div key={strategy} className="bg-black/20 p-3 rounded-lg border border-white/5">
                                <p className="text-[9px] text-slate-400 font-bold mb-2 leading-tight">{strategy}</p>
                                <p className={`text-xl font-black mb-1 ${rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{rate.toFixed(0)}%</p>
                                <div className="flex justify-between text-[9px] mt-2">
                                    <span className="text-green-500">W:{counts.wins}</span>
                                    <span className="text-red-500">L:{counts.losses}</span>
                                    <span className="text-slate-500">T:{total}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-4 pb-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-blue-300 italic">
                        💡 Gợi ý: Robot vận hành tự động theo các khung giờ vàng để tối ưu xác suất thắng cao nhất.
                    </p>
                </div>
            </div>
        </div>
    );
};
