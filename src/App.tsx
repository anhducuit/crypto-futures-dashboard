/**
 * Copyright © 2026 Anh Duc Trader. All rights reserved.
 * Unauthorized copying, distribution, or use of this file is strictly prohibited.
 */
import { useState, useEffect } from 'react';
import { Activity, BarChart2 } from 'lucide-react';
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
import { ICTKillzonesPanel } from './components/ICTKillzonesPanel';
import { TradeMonitor } from './components/TradeMonitor';
import { IchimokuPanel } from './components/IchimokuPanel';
import { DivergencePanel } from './components/DivergencePanel';
import { KeyLevelsPanel } from './components/KeyLevelsPanel';
import { ChandelierExitPanel } from './components/ChandelierExitPanel';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav, type TabType } from './components/BottomNav';
import './index.css';

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [activeTab, setActiveTab] = useState<TabType>('trade');
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


  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-golden)]/30 border-t-[var(--color-golden)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-[450px] h-[600px] bg-[var(--color-bg-primary)] overflow-y-auto">
        <Auth />
      </div>
    );
  }

  return (
    <div className="w-[450px] h-[600px] flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[var(--color-golden)]/5 to-transparent pointer-events-none z-0"></div>
      
      {tradeMonitor}

      <MobileHeader session={session} isConnected={isConnected} />

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto relative z-10 w-full pt-2">
        
        {activeTab === 'trade' && (
          <div className="space-y-4 px-3 pb-6">
            <EventTicker />
            
            <div className="card !p-3">
              <div className="card-header !mb-2">
                <BarChart2 size={16} className="text-[var(--color-golden)]" />
                MÃ GIAO DỊCH
              </div>
              <SymbolInput
                symbol={symbol}
                onSymbolChange={setSymbol}
                isConnected={isConnected}
                onReconnect={reconnect}
              />
            </div>

            <LivePriceDisplay
              price={currentPrice}
              previousPrice={previousPrice}
              priceDirection={priceDirection}
              symbol={symbol}
              error={error}
              onManualPrice={setManualPrice}
            />

            <div className="card !p-3">
              <div className="card-header !mb-2">HƯỚNG LỆNH (DIRECTION)</div>
              <DirectionSelector
                direction={direction}
                onDirectionChange={setDirection}
              />
            </div>

            <VolumeAnalysis symbol={symbol} maAnalysis={maAnalysis} />

            <div className="h-[400px]">
              <TradingViewWidget symbol={symbol} timeframe={activeTimeframe} />
            </div>

            <PriceTicker />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 px-3 pb-6">
            <div className="card !p-3 mt-2">
              <div className="card-header !mb-2 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Activity size={16} className="text-[var(--color-golden)]" />
                  ĐANG QUAN SÁT (MONITOR)
                </span>
              </div>
              <TradeMonitor />
            </div>

            <div className="card overflow-x-auto !p-3">
              <HistoryDashboard symbol={symbol} />
            </div>

            <TradeAnalytics />
          </div>
        )}

        {activeTab === 'bots' && (
          <div className="space-y-4 px-3 pb-6 mt-2">
            <TradingRecommendation
              maAnalysis={maAnalysis}
              onDirectionChange={setDirection}
            />
            
            <MarketTrends onSymbolSelect={setSymbol} />
            
            <ICTKillzonesPanel />

            <MovingAveragesPanel
              symbol={symbol}
              data={maAnalysis}
              loading={maLoading}
              onRefresh={refetchMA}
              activeTimeframe={activeTimeframe}
              onTimeframeChange={setActiveTimeframe}
            />

            <IchimokuPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
            <DivergencePanel data={maAnalysis} activeTimeframe={activeTimeframe} />
            <KeyLevelsPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
            <ChandelierExitPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4 px-3 pb-6 mt-2">
            <GuideBar />
            
            <EMATrendBias trends={emaTrends} />

            <FibonacciCalculator
              symbol={symbol}
              direction={direction}
              maAnalysis={maAnalysis}
              maLoading={maLoading}
              onRefreshMA={refetchMA}
            />

            <div className="text-center text-xs text-[var(--color-text-secondary)] opacity-50 mt-8 mb-4">
              <p>Phiên bản Chrome Extension v1.0.0</p>
              <p>© 2026 Anh Duc Trader</p>
            </div>
          </div>
        )}

      </main>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}

export default App;
