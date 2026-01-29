/**
 * Copyright © 2026 Anh Duc Trader. All rights reserved.
 * Unauthorized copying, distribution, or use of this file is strictly prohibited.
 */
import { useState, useEffect } from 'react';
import { Activity, BarChart2, Menu, X, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { useBinanceWebSocket } from './hooks/useBinanceWebSocket';
import { useBinanceKlines } from './hooks/useBinanceKlines';
import { SymbolInput } from './components/SymbolInput';
import { LivePriceDisplay } from './components/LivePriceDisplay';
import { DirectionSelector } from './components/DirectionSelector';
import { PriceTicker } from './components/PriceTicker';
import { EventTicker } from './components/EventTicker';
import { GuideBar } from './components/GuideBar';
import { MarketTrends } from './components/MarketTrends';
import { MovingAveragesPanel } from './components/MovingAveragesPanel';
import { EMATrendBias } from './components/EMATrendBias';
import { useEMATrendBias } from './hooks/useEMATrendBias';
import { useSignalGenerator } from './hooks/useSignalGenerator';
import { FibonacciCalculator } from './components/FibonacciCalculator';
import { TradeAnalytics } from './components/TradeAnalytics';
import { TradingViewWidget } from './components/TradingViewWidget';
import { TradingRecommendation } from './components/TradingRecommendation';
import { VolumeAnalysis } from './components/VolumeAnalysis';
import { HistoryDashboard } from './components/HistoryDashboard';
import { MarketAnomaliesPanel } from './components/MarketAnomaliesPanel';
import { TradeMonitor } from './components/TradeMonitor';
import { RegisterPage } from './pages/RegisterPage';
import { IchimokuPanel } from './components/IchimokuPanel';
import { DivergencePanel } from './components/DivergencePanel';
import { KeyLevelsPanel } from './components/KeyLevelsPanel';
// import { BacktestDashboard } from './components/BacktestDashboard'; // Disabled temporarily
import IntroPage from './pages/IntroPage';
import './index.css';

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState('15'); // 15, 1, 60, 240

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


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

  // EMA Trend Bias (Dynamic from higher timeframes)
  const { trends: emaTrends } = useEMATrendBias(symbol);

  // Background Trade Monitor (Checks PENDING trades)
  const tradeMonitor = session ? <TradeMonitor /> : null;

  // Automated Signal Generator (Disabled - Logic moved to Server)
  useSignalGenerator();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-golden)]/30 border-t-[var(--color-golden)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    // Basic routing logic for Login/Register without full React Router
    const path = window.location.pathname;
    if (path === '/intro') {
      return <IntroPage />;
    }
    if (path === '/register') {
      return <RegisterPage />;
    }
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {tradeMonitor}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg-secondary)]/95 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[var(--color-golden)] to-yellow-600 rounded-lg">
              <BarChart2 size={24} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pro Crypto Futures</h1>
              <p className="text-[11px] text-yellow-500 font-black uppercase tracking-[0.2em] drop-shadow-sm">by Anh Duc Trader</p>
            </div>
          </div>

          <PriceTicker />

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-tertiary)] rounded-lg">
              <Activity size={14} className={isConnected ? 'text-green-500' : 'text-red-500'} />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>

          <button
            className="md:hidden p-2 text-[var(--color-text-secondary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <EventTicker />
      <GuideBar />

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

            {/* Volume Analysis Section */}
            <VolumeAnalysis symbol={symbol} maAnalysis={maAnalysis} />

            {/* Moving Averages Analysis */}
            <MovingAveragesPanel
              symbol={symbol}
              data={maAnalysis}
              loading={maLoading}
              onRefresh={refetchMA}
              activeTimeframe={activeTimeframe}
              onTimeframeChange={setActiveTimeframe}
            />

            {/* EMA Trend Bias */}
            <EMATrendBias trends={emaTrends} />

            {/* Advanced Analysis Panels */}
            <div className="grid grid-cols-1 gap-4">
              <IchimokuPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
              <DivergencePanel data={maAnalysis} activeTimeframe={activeTimeframe} />
              <KeyLevelsPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
            </div>
          </div>

          {/* Center - TradingView Chart & History */}
          <div className="lg:col-span-5 space-y-4 flex flex-col min-h-0">
            <div className="flex-shrink-0">
              <TradingViewWidget symbol={symbol} timeframe={activeTimeframe} />
            </div>
            <div className="h-[1000px] flex-shrink-0">
              <HistoryDashboard symbol={symbol} />
            </div>
            <div className="flex flex-col space-y-4">
              <div className="h-[800px]">
                <MarketAnomaliesPanel />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Calculators */}
          <div className="lg:col-span-4 space-y-4">
            {/* Market Trends (Top Gainers/Losers) */}
            <MarketTrends onSymbolSelect={setSymbol} />

            {/* Fibonacci Calculator */}
            <FibonacciCalculator
              symbol={symbol}
              direction={direction}
              maAnalysis={maAnalysis}
              maLoading={maLoading}
              onRefreshMA={refetchMA}
            />

            {/* Win/Loss Analytics Report */}
            <TradeAnalytics />

            {/* Backtest Dashboard - DISABLED: Causing app crash, needs debugging */}
            {/* <BacktestDashboard /> */}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-text-secondary)]">
        <p>© 2026 Anh Duc Trader. All rights reserved.</p>
        <p className="text-xs mt-1 opacity-70">⚠️ Đây là công cụ hỗ trợ phân tích độc quyền. Không phải lời khuyên đầu tư.</p>
      </footer>
    </div>
  );
}

export default App;
