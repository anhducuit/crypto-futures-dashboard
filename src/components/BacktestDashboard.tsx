import React, { useState, useEffect } from 'react';
import { Play, Clock, BarChart3, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatNumber } from '../utils/calculations';

interface BacktestRun {
    id: string;
    created_at: string;
    strategy_name: string;
    timeframe: string;
    symbol: string;
    start_date: string;
    end_date: string;
    initial_capital: number;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    total_pnl: number;
    final_capital: number;
    execution_time_ms: number;
    error_message: string | null;
}

export const BacktestDashboard: React.FC = () => {
    const [runs, setRuns] = useState<BacktestRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState<string | null>(null);

    // Form state
    const [config, setConfig] = useState({
        strategy: 'EMA_CROSS',
        timeframe: '15m',
        symbol: 'BTCUSDT',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
        initialCapital: 10000,
        riskPercentage: 2,
        leverage: 20
    });

    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        fetchRuns();
        const interval = setInterval(fetchRuns, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchRuns = async () => {
        try {
            const { data, error } = await supabase
                .from('backtest_runs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setRuns(data || []);
        } catch (e) {
            console.error('Error fetching backtest runs:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRunBacktest = async () => {
        setIsRunning(true);
        try {
            const { data, error } = await supabase.functions.invoke('backtest', {
                body: {
                    strategy: config.strategy,
                    timeframe: config.timeframe,
                    symbol: config.symbol,
                    startDate: new Date(config.startDate).toISOString(),
                    endDate: new Date(config.endDate).toISOString(),
                    initialCapital: config.initialCapital,
                    riskPercentage: config.riskPercentage,
                    leverage: config.leverage
                }
            });

            if (error) throw error;

            console.log('Backtest started:', data);

            // Refresh list immediately
            await fetchRuns();
        } catch (e: any) {
            console.error('Error starting backtest:', e);
            alert('Failed to start backtest: ' + e.message);
        } finally {
            setIsRunning(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="flex items-center gap-1 text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> HOÀN THÀNH</span>;
            case 'RUNNING':
                return <span className="flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full"><Loader2 size={10} className="animate-spin" /> ĐANG CHẠY</span>;
            case 'FAILED':
                return <span className="flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full"><XCircle size={10} /> THẤT BẠI</span>;
            default:
                return <span className="flex items-center gap-1 text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full"><Clock size={10} /> CHỜ XỬ LÝ</span>;
        }
    };

    return (
        <div className="card">
            <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-[var(--color-golden)]" />
                    BACKTESTING DASHBOARD
                </div>
                <button
                    onClick={fetchRuns}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                    <RefreshCw size={14} className="text-[var(--color-text-secondary)]" />
                </button>
            </div>

            {/* Configuration Form */}
            <div className="mb-6 p-4 bg-[var(--color-bg-tertiary)] rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-golden)] mb-3">CẤU HÌNH BACKTEST</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Chiến lược</label>
                        <select
                            value={config.strategy}
                            onChange={(e) => setConfig({ ...config, strategy: e.target.value })}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                        >
                            <option value="EMA_CROSS">EMA Cross (12/26)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Khung giờ</label>
                        <select
                            value={config.timeframe}
                            onChange={(e) => setConfig({ ...config, timeframe: e.target.value })}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                        >
                            <option value="1m">1 phút</option>
                            <option value="15m">15 phút</option>
                            <option value="1h">1 giờ</option>
                            <option value="4h">4 giờ</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Symbol</label>
                        <select
                            value={config.symbol}
                            onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                        >
                            <option value="BTCUSDT">BTC/USDT</option>
                            <option value="ETHUSDT">ETH/USDT</option>
                            <option value="SOLUSDT">SOL/USDT</option>
                            <option value="XRPUSDT">XRP/USDT</option>
                            <option value="BNBUSDT">BNB/USDT</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Vốn ban đầu ($)</label>
                        <input
                            type="number"
                            value={config.initialCapital}
                            onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) })}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Ngày bắt đầu</label>
                        <input
                            type="date"
                            value={config.startDate}
                            onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Ngày kết thúc</label>
                        <input
                            type="date"
                            value={config.endDate}
                            onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Rủi ro (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={config.riskPercentage}
                            onChange={(e) => setConfig({ ...config, riskPercentage: parseFloat(e.target.value) })}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Đòn bẩy (x)</label>
                        <input
                            type="number"
                            value={config.leverage}
                            onChange={(e) => setConfig({ ...config, leverage: parseInt(e.target.value) })}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                        />
                    </div>
                </div>

                <button
                    onClick={handleRunBacktest}
                    disabled={isRunning}
                    className="w-full bg-gradient-to-r from-[var(--color-golden)] to-yellow-600 hover:scale-[1.02] active:scale-[0.98] text-black rounded-lg font-black transition-all text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRunning ? (
                        <><Loader2 size={16} className="animate-spin" /> ĐANG KHỞI ĐỘNG...</>
                    ) : (
                        <><Play size={16} /> CHẠY BACKTEST</>
                    )}
                </button>
            </div>

            {/* Results Table */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--color-golden)]">LỊCH SỬ BACKTEST</h3>

                {loading ? (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">Đang tải...</div>
                ) : runs.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-secondary)] text-xs">
                        Chưa có backtest nào. Hãy tạo backtest đầu tiên!
                    </div>
                ) : (
                    runs.map((run) => (
                        <div
                            key={run.id}
                            className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-golden)] transition-colors cursor-pointer"
                            onClick={() => setSelectedRun(run.id === selectedRun ? null : run.id)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold">{run.symbol}</span>
                                    <span className="text-[10px] text-[var(--color-text-secondary)]">{run.timeframe}</span>
                                    <span className="text-[10px] text-[var(--color-text-secondary)]">{run.strategy_name}</span>
                                </div>
                                {getStatusBadge(run.status)}
                            </div>

                            {run.status === 'COMPLETED' && (
                                <div className="grid grid-cols-4 gap-2 text-[10px]">
                                    <div>
                                        <span className="text-[var(--color-text-secondary)]">Tổng lệnh: </span>
                                        <span className="font-bold">{run.total_trades}</span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--color-text-secondary)]">Tỉ lệ thắng: </span>
                                        <span className={`font-bold ${run.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                            {run.win_rate?.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--color-text-secondary)]">PnL: </span>
                                        <span className={`font-bold ${run.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${formatNumber(run.total_pnl, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--color-text-secondary)]">Vốn cuối: </span>
                                        <span className="font-bold">${formatNumber(run.final_capital, 2)}</span>
                                    </div>
                                </div>
                            )}

                            {run.status === 'FAILED' && run.error_message && (
                                <div className="text-[10px] text-red-400 mt-2">
                                    Lỗi: {run.error_message}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
