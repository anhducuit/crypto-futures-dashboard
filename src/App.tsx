import { useState, useCallback } from 'react';
import { Activity, BarChart2, Menu, X } from 'lucide-react';
import { useBinanceWebSocket } from './hooks/useBinanceWebSocket';
import { useBinanceKlines } from './hooks/useBinanceKlines';
import { SymbolInput } from './components/SymbolInput';
import { LivePriceDisplay } from './components/LivePriceDisplay';
import { DirectionSelector } from './components/DirectionSelector';
import { MovingAveragesPanel } from './components/MovingAveragesPanel';
import { EMATrendBias } from './components/EMATrendBias';
import { FibonacciCalculator } from './components/FibonacciCalculator';
import { PositionCalculator } from './components/PositionCalculator';
import { TPCalculator } from './components/TPCalculator';
import { TradingViewWidget } from './components/TradingViewWidget';
import { TradingRecommendation } from './components/TradingRecommendation';
import './index.css';

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected swing data from MA panel
  const [selectedSwing, setSelectedSwing] = useState<{
    high: number;
    low: number;
    timeframe: string;
  } | null>(null);

  // WebSocket connection
  const {
    isConnected,
    currentPrice,
    previousPrice,
    priceDirection,
    error,
    setManualPrice,
    reconnect
  } = useBinanceWebSocket(symbol);

  // Klines data for MA analysis
  const {
    data: maAnalysis,
    loading: maLoading,
    refetch: refetchMA
  } = useBinanceKlines(symbol);

  // EMA Trend Bias - Simulated based on MA data (can be enhanced)
  const [emaTrends] = useState([
    { timeframe: '1D', label: 'Daily', bias: 'bullish' as const },
    { timeframe: '1W', label: 'Weekly', bias: 'bullish' as const },
    { timeframe: '1M', label: 'Monthly', bias: 'neutral' as const },
  ]);

  // Handle swing selection from MA panel
  const handleSelectSwing = useCallback((swingHigh: number, swingLow: number, timeframe: string) => {
    setSelectedSwing({ high: swingHigh, low: swingLow, timeframe });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg-secondary)]/95 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[var(--color-golden)] to-yellow-600 rounded-lg">
              <BarChart2 size={24} className="text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Pro Crypto Futures</h1>
              <p className="text-xs text-[var(--color-golden)] font-semibold">by Anh Duc Trader</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-tertiary)] rounded-lg">
              <Activity size={14} className={isConnected ? 'text-green-500' : 'text-red-500'} />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
              </span>
            </div>
          </div>

          <button
            className="md:hidden p-2 text-[var(--color-text-secondary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Left Sidebar - Symbol & Controls */}
          <div className="lg:col-span-3 space-y-4">
            {/* Symbol Input */}
            <div className="card">
              <div className="card-header">
                <BarChart2 size={16} className="text-[var(--color-golden)]" />
                SYMBOL
              </div>
              <SymbolInput
                symbol={symbol}
                onSymbolChange={setSymbol}
                isConnected={isConnected}
                onReconnect={reconnect}
              />
            </div>

            {/* Live Price */}
            <LivePriceDisplay
              price={currentPrice}
              previousPrice={previousPrice}
              priceDirection={priceDirection}
              symbol={symbol}
              error={error}
              onManualPrice={setManualPrice}
            />

            {/* Direction Selector */}
            <div className="card">
              <div className="card-header">HƯỚNG GIAO DỊCH</div>
              <DirectionSelector
                direction={direction}
                onDirectionChange={setDirection}
              />
            </div>

            {/* Trading Recommendation */}
            <TradingRecommendation
              maAnalysis={maAnalysis}
              onDirectionChange={setDirection}
            />

            {/* Moving Averages Analysis */}
            <MovingAveragesPanel
              data={maAnalysis}
              loading={maLoading}
              onRefresh={refetchMA}
              onSelectSwing={handleSelectSwing}
            />

            {/* EMA Trend Bias */}
            <EMATrendBias trends={emaTrends} />
          </div>

          {/* Center - TradingView Chart */}
          <div className="lg:col-span-5 space-y-4">
            <TradingViewWidget symbol={symbol} />
          </div>

          {/* Right Sidebar - Calculators */}
          <div className="lg:col-span-4 space-y-4">
            {/* Fibonacci Calculator */}
            <FibonacciCalculator
              direction={direction}
              maAnalysis={maAnalysis}
              maLoading={maLoading}
              onRefreshMA={refetchMA}
            />

            {/* Position Calculator */}
            <PositionCalculator
              currentPrice={currentPrice}
              direction={direction}
              swingLow={selectedSwing?.low}
              entryPrice={entryPrice}
              onEntryChange={setEntryPrice}
            />

            {/* TP Calculator */}
            <TPCalculator
              direction={direction}
              entryPrice={entryPrice}
              onEntryChange={setEntryPrice}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-text-secondary)]">
        <p>Pro Crypto Futures Analysis Dashboard • Dữ liệu real-time từ Binance</p>
        <p className="text-xs mt-1 opacity-70">⚠️ Đây là công cụ hỗ trợ phân tích. Không phải lời khuyên đầu tư.</p>
      </footer>
    </div>
  );
}

export default App;
