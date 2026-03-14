/**
 * Copyright © 2026 Anh Duc Trader. All rights reserved.
 * Unauthorized copying, distribution, or use of this file is strictly prohibited.
 */
import { useState, useEffect } from 'react';
import { Activity, BarChart2, Menu, X, LogOut, LayoutDashboard, Microscope, Bot } from 'lucide-react';
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
import { GoldenHourAnalysis } from './components/GoldenHourAnalysis';
import { useTradeAnalytics } from './hooks/useTradeAnalytics';
import { AnalysisGlobalControls } from './components/AnalysisGlobalControls';
import './index.css';

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [activeTab, setActiveTab] = useState<TabType>('trade');
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState('15'); // 15, 1, 60, 240
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopActiveTab, setDesktopActiveTab] = useState<'overview' | 'analysis' | 'bot'>('overview');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 800);
  const { bestHours, strategyStats } = useTradeAnalytics('all');

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const renderMobileView = () => {
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
  };

  const renderDesktopView = () => {
    return (
      <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] overflow-hidden">
        {tradeMonitor}
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[var(--color-bg-secondary)]/95 backdrop-blur-md border-b border-[var(--color-border)] flex-shrink-0">
          <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between w-full">
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

        <div className="flex-shrink-0 w-full bg-[var(--color-bg-primary)] px-4 py-2 space-y-2 border-b border-[var(--color-border)]">
          <EventTicker />
          <GuideBar />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Sidebar */}
          <aside className="w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col p-4 space-y-2 flex-shrink-0">
            <button
              onClick={() => setDesktopActiveTab('overview')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                desktopActiveTab === 'overview' 
                ? 'bg-[var(--color-golden)] text-black font-bold shadow-lg shadow-yellow-500/20' 
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-white'
              }`}
            >
              <LayoutDashboard size={20} />
              <span>OVERVIEW</span>
            </button>
            <button
              onClick={() => setDesktopActiveTab('analysis')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                desktopActiveTab === 'analysis' 
                ? 'bg-[var(--color-golden)] text-black font-bold shadow-lg shadow-yellow-500/20' 
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-white'
              }`}
            >
              <Microscope size={20} />
              <span>ANALYSIS</span>
            </button>
            <button
              onClick={() => setDesktopActiveTab('bot')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                desktopActiveTab === 'bot' 
                ? 'bg-[var(--color-golden)] text-black font-bold shadow-lg shadow-yellow-500/20' 
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-white'
              }`}
            >
              <Bot size={20} />
              <span>BOT TRADE</span>
            </button>

            <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
               <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-xs text-[var(--color-text-secondary)]">
                  <p className="mb-1 font-bold text-[var(--color-golden)]">Hệ thống Trading Pro</p>
                  <p>Phiên bản: 1.2.0</p>
               </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-primary)]">
            <div className="max-w-[1600px] mx-auto space-y-6">
              
              {desktopActiveTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                      <div className="h-[650px] w-full">
                        <TradingViewWidget symbol={symbol} timeframe={activeTimeframe} />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="card">
                        <div className="card-header">
                          <BarChart2 size={16} className="text-[var(--color-golden)]" />
                          SYMBOL
                        </div>
                        <SymbolInput symbol={symbol} onSymbolChange={setSymbol} isConnected={isConnected} onReconnect={reconnect} />
                      </div>
                      <LivePriceDisplay price={currentPrice} previousPrice={previousPrice} priceDirection={priceDirection} symbol={symbol} error={error} onManualPrice={setManualPrice} />
                      <MarketTrends onSymbolSelect={setSymbol} />
                    </div>
                  </div>
                </div>
              )}

              {desktopActiveTab === 'analysis' && (
                <div className="space-y-6">
                  {/* Global Analysis Controls */}
                  <AnalysisGlobalControls 
                    symbol={symbol}
                    onSymbolChange={setSymbol}
                    activeTimeframe={activeTimeframe}
                    onTimeframeChange={setActiveTimeframe}
                    direction={direction}
                    onDirectionChange={setDirection}
                    maAnalysis={maAnalysis}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Column 1: TREND & MOMENTUM (XU HƯỚNG) */}
                    <div className="lg:col-span-4 space-y-6">
                      <EMATrendBias trends={emaTrends} />
                      <MovingAveragesPanel symbol={symbol} data={maAnalysis} loading={maLoading} onRefresh={refetchMA} activeTimeframe={activeTimeframe} />
                      <IchimokuPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
                      <DivergencePanel data={maAnalysis} activeTimeframe={activeTimeframe} />
                    </div>

                    {/* Column 2: ZONES & LEVELS (VÙNG GIÁ & CẢN) */}
                    <div className="lg:col-span-4 space-y-6">
                      <KeyLevelsPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
                      <ICTKillzonesPanel />
                      <FibonacciCalculator symbol={symbol} direction={direction} maAnalysis={maAnalysis} maLoading={maLoading} onRefreshMA={refetchMA} />
                    </div>

                    {/* Column 3: SIGNALS & DECISION (TÍN HIỆU & VÀO LỆNH) */}
                    <div className="lg:col-span-4 space-y-6">
                      <TradingRecommendation maAnalysis={maAnalysis} onDirectionChange={setDirection} />
                      <div className="card">
                        <div className="card-header bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                           <span className="font-bold tracking-tight uppercase">XÁC NHẬN KHỐI LƯỢNG (VOLUME)</span>
                        </div>
                        <div className="p-4">
                           <VolumeAnalysis symbol={symbol} maAnalysis={maAnalysis} />
                        </div>
                      </div>
                      <ChandelierExitPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
                    </div>
                  </div>
                </div>
              )}

              {desktopActiveTab === 'bot' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                      <div className="h-[750px]">
                        <HistoryDashboard symbol={symbol} />
                      </div>
                      <GoldenHourAnalysis bestHours={bestHours} strategyStats={strategyStats} />
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                      <TradeAnalytics />
                      <div className="card p-4 bg-blue-500/5 border border-blue-500/10">
                         <h4 className="text-xs font-bold text-blue-400 mb-2 uppercase">Lưu ý vận hành</h4>
                         <p className="text-[11px] text-slate-400 leading-relaxed italic">
                            Các chỉ số thống kê giúp anh nhận diện xu hướng hành vi của thị trường. Hãy kết hợp cùng bảng Phân tích để có cái nhìn đa chiều nhất.
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex-shrink-0">
          <div className="text-center text-xs text-[var(--color-text-secondary)] opacity-70">
            <p>© 2026 Anh Duc Trader. Đây là công cụ hỗ trợ phân tích độc quyền. Không phải lời khuyên đầu tư.</p>
          </div>
        </footer>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-golden)]/30 border-t-[var(--color-golden)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={isMobileView ? "w-[450px] h-[600px] bg-[var(--color-bg-primary)] overflow-y-auto" : "min-h-screen bg-[var(--color-bg-primary)]"}>
        <Auth />
      </div>
    );
  }

  return isMobileView ? renderMobileView() : renderDesktopView();
}

export default App;
