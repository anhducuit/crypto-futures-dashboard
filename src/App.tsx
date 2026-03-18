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
import { DexTrendingPanel } from './components/DexTrendingPanel';
import { useTradeAnalytics } from './hooks/useTradeAnalytics';
import { AnalysisGlobalControls } from './components/AnalysisGlobalControls';
import { useTranslation, type Language } from './utils/translations';
import { MascotIcon, Mascot } from './components/MascotGallery';
import './index.css';

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState('15'); // 15, 1, 60, 240
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopActiveTab, setDesktopActiveTab] = useState<'overview' | 'analysis' | 'bot' | 'dex'>('overview');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 800);
  const [language, setLanguage] = useState<Language>('vi');
  const t = useTranslation(language);
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
      <div className="w-full min-h-screen flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[var(--color-golden)]/5 to-transparent pointer-events-none z-0"></div>
        
        {tradeMonitor}

        <MobileHeader session={session} isConnected={isConnected} />

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto relative z-10 w-full pt-2 pb-24">
        <EventTicker language={language} />
        
        {activeTab === 'overview' && (
          <div className="space-y-4 px-3 pb-6">
            <div className="h-[450px] mt-2 card !p-0 overflow-hidden border-none shadow-xl">
              <TradingViewWidget symbol={symbol} timeframe={activeTimeframe} />
            </div>

            <LivePriceDisplay
              price={currentPrice}
              previousPrice={previousPrice}
              priceDirection={priceDirection}
              symbol={symbol}
              error={error}
              onManualPrice={setManualPrice}
              language={language}
            />

            <div className="card flare-border !p-3">
              <div className="card-header !mb-2 text-xs">
                <BarChart2 size={14} className="text-[var(--color-flare)]" />
                {t('active_instrument')}
              </div>
              <SymbolInput
                symbol={symbol}
                onSymbolChange={setSymbol}
                isConnected={isConnected}
                onReconnect={reconnect}
              />
            </div>

            <div className="card !p-3">
              <div className="card-header !mb-2">{t('direction_order')}</div>
              <DirectionSelector
                direction={direction}
                onDirectionChange={setDirection}
              />
            </div>

            <MarketTrends onSymbolSelect={setSymbol} language={language} />
            <PriceTicker />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4 px-3 pb-6 mt-2">
            <AnalysisGlobalControls 
              symbol={symbol}
              onSymbolChange={setSymbol}
              activeTimeframe={activeTimeframe}
              onTimeframeChange={setActiveTimeframe}
              direction={direction}
              onDirectionChange={setDirection}
              maAnalysis={maAnalysis}
              language={language}
            />

            <EMATrendBias trends={emaTrends} />
            <MovingAveragesPanel
              symbol={symbol}
              data={maAnalysis}
              loading={maLoading}
              onRefresh={refetchMA}
              activeTimeframe={activeTimeframe}
              language={language}
            />
            <IchimokuPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
            <DivergencePanel data={maAnalysis} activeTimeframe={activeTimeframe} />
            <KeyLevelsPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
            <ICTKillzonesPanel language={language} />
            <FibonacciCalculator
              symbol={symbol}
              direction={direction}
              maAnalysis={maAnalysis}
              maLoading={maLoading}
              onRefreshMA={refetchMA}
            />
            <TradingRecommendation
              maAnalysis={maAnalysis}
              onDirectionChange={setDirection}
              language={language}
            />
            <VolumeAnalysis symbol={symbol} maAnalysis={maAnalysis} language={language} />
            <ChandelierExitPanel data={maAnalysis} activeTimeframe={activeTimeframe} language={language} />
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="space-y-4 px-3 pb-6 mt-2">
            <div className="card !p-3">
              <div className="card-header !mb-2 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Activity size={16} className="text-[var(--color-golden)]" />
                  {t('observing_monitor')}
                </span>
              </div>
              <TradeMonitor />
            </div>

            <div className="card overflow-x-auto !p-3">
              <HistoryDashboard symbol={symbol} language={language} />
            </div>

            <GoldenHourAnalysis bestHours={bestHours} strategyStats={strategyStats} language={language} />
            <TradeAnalytics language={language} />
            
            <div className="card !p-3 mt-4">
              <GuideBar language={language} />
            </div>

            <div className="text-center text-[10px] text-[var(--color-silver)] opacity-30 mt-8 mb-4 uppercase tracking-[0.2em] font-black">
               <p>© 2026 Anh Duc Trader  //  PRO-PROTOCOLS</p>
            </div>
          </div>
        )}

        {activeTab === 'dex' && (
          <div className="space-y-4 px-3 pb-6 mt-2">
            <DexTrendingPanel language={language} />
          </div>
        )}

      </main>

        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>
    );
  };

  const renderDesktopView = () => {
    return (
      <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] overflow-hidden relative">
        {tradeMonitor}
        
        {/* Header - Cinematic Luxury */}
        <header className="sticky top-0 z-50 glass-luxury border-b border-[var(--color-border)] flex-shrink-0">
          <div className="max-w-[1920px] mx-auto px-8 py-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-[var(--color-flare)] rounded-[2px] flare-glow">
                <BarChart2 size={22} className="text-black" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter leading-none italic">PRO FUTURES</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-[1px] w-4 bg-[var(--color-flare)]"></span>
                  <p className="text-[9px] text-[var(--color-silver)] font-bold uppercase tracking-[0.4em]">by Anh Duc Trader</p>
                </div>
              </div>
            </div>

            <div className="flex-1 hidden md:flex justify-center items-center px-12 overflow-hidden">
              <PriceTicker />
            </div>

            <div className="hidden md:flex items-center gap-6">
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-[2px] text-[10px] font-black hover:bg-[var(--color-flare)] hover:text-black transition-all group"
              >
                <span className={language === 'vi' ? 'text-white group-hover:text-black' : 'text-[var(--color-silver)]'}>VN</span>
                <span className="text-white/20">/</span>
                <span className={language === 'en' ? 'text-white group-hover:text-black' : 'text-[var(--color-silver)]'}>EN</span>
              </button>

              <div className="flex items-center gap-2.5 px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-[2px]">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--color-long)] animate-signal' : 'bg-[var(--color-short)]'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-silver)]">
                  {isConnected ? t('node_connected') : t('system_offline')}
                </span>
              </div>
              
              <div className="w-[1px] h-8 bg-[var(--color-border)] mx-2"></div>

              <button
                onClick={handleLogout}
                className="group p-2 text-[var(--color-silver)] hover:text-[var(--color-short)] transition-all duration-300"
                title={t('logout')}
              >
                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <button
              className="md:hidden p-2 text-[var(--color-white)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        <div className="flex-shrink-0 w-full bg-[var(--color-bg-primary)]">
          <EventTicker language={language} />
          <GuideBar language={language} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Sidebar - Cyberpunk */}
          <aside className="w-20 lg:w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col p-4 space-y-3 flex-shrink-0 transition-all duration-500 relative overflow-hidden">
            {/* Ambient neon glow on sidebar */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-flare)]/5 via-transparent to-[var(--color-long)]/5 pointer-events-none"></div>

            {/* LUCIA Mascot - Sidebar header */}
            <div className="relative mb-4 hidden lg:flex flex-col items-center pt-2 pb-4 border-b border-[var(--color-border)]">
              <MascotIcon variant="lucia" className="w-28 h-28" />
              <p className="font-kanit text-[10px] font-extrabold text-[var(--color-flare)] tracking-[0.1em] uppercase mt-1" style={{textShadow: '0 0 8px var(--color-flare)'}}>LUCIA Pro</p>
              <p className="font-inter text-[7px] text-white/20 uppercase tracking-widest font-medium">Alpha_Legend</p>
            </div>

            <div className="mb-2 px-2 hidden lg:block">
              <p className="text-[9px] font-kanit font-bold text-[var(--color-silver)] tracking-[0.15em] uppercase opacity-40">{t('command_center')}</p>
            </div>

            <button
              onClick={() => setDesktopActiveTab('overview')}
              className={`flex items-center gap-4 px-4 py-4 rounded-[2px] transition-all duration-300 group ${
                desktopActiveTab === 'overview' 
                ? 'bg-[var(--color-flare)] text-black font-black' 
                : 'text-[var(--color-silver)] hover:bg-[var(--color-bg-tertiary)] hover:text-white'
              }`}
            >
              <LayoutDashboard size={20} className={desktopActiveTab === 'overview' ? '' : 'group-hover:scale-110 transition-transform'} />
              <span className="hidden lg:block text-xs font-black tracking-widest">{t('overview')}</span>
            </button>

            <button
              onClick={() => setDesktopActiveTab('analysis')}
              className={`flex items-center gap-4 px-4 py-4 rounded-[2px] transition-all duration-300 group ${
                desktopActiveTab === 'analysis' 
                ? 'bg-[var(--color-flare)] text-black font-black' 
                : 'text-[var(--color-silver)] hover:bg-[var(--color-bg-tertiary)] hover:text-white'
              }`}
            >
              <Microscope size={20} className={desktopActiveTab === 'analysis' ? '' : 'group-hover:scale-110 transition-transform'} />
              <span className="hidden lg:block text-xs font-black tracking-widest">{t('analysis')}</span>
            </button>

            <button
              onClick={() => setDesktopActiveTab('bot')}
              className={`flex items-center gap-4 px-4 py-4 rounded-[2px] transition-all duration-300 group ${
                desktopActiveTab === 'bot' 
                ? 'bg-[var(--color-flare)] text-black font-black' 
                : 'text-[var(--color-silver)] hover:bg-[var(--color-bg-tertiary)] hover:text-white'
              }`}
            >
              <Bot size={20} className={desktopActiveTab === 'bot' ? '' : 'group-hover:scale-110 transition-transform'} />
              <span className="hidden lg:block text-xs font-black tracking-widest">{t('bot_trade')}</span>
            </button>

            <button
              onClick={() => setDesktopActiveTab('dex')}
              className={`flex items-center gap-4 px-4 py-4 rounded-[2px] transition-all duration-300 group ${
                desktopActiveTab === 'dex' 
                ? 'bg-[var(--color-flare)] text-black font-black' 
                : 'text-[var(--color-silver)] hover:bg-[var(--color-bg-tertiary)] hover:text-white'
              }`}
            >
              <Activity size={20} className={desktopActiveTab === 'dex' ? '' : 'group-hover:scale-110 transition-transform'} />
              <span className="hidden lg:block text-xs font-black tracking-widest">DEX Pulse</span>
            </button>

            <div className="mt-auto pt-6 border-t border-[var(--color-border)] px-2">
               <div className="flex flex-col gap-1 hidden lg:block">
                  <p className="text-[9px] font-black text-[var(--color-flare)] tracking-tighter uppercase italic">{t('institutional_access')}</p>
                  <p className="text-[8px] text-[var(--color-silver)] font-mono opacity-50 uppercase">v1.2.0-flare</p>
               </div>
            </div>
          </aside>

          {/* Main Content Area - Asymmetric Spacing */}
          <main className="flex-1 overflow-y-auto p-10 bg-[var(--color-bg-primary)] scroll-smooth">
            <div className="max-w-[1700px] mx-auto reveal">
              
              {desktopActiveTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-9 space-y-10">
                    <div className="h-[700px] card !p-0 border-none shadow-2xl shadow-black/50 overflow-hidden">
                      <TradingViewWidget symbol={symbol} timeframe={activeTimeframe} />
                    </div>
                  </div>
                  
                  <div className="lg:col-span-3 space-y-4">
                    <div className="reveal">
                      <LivePriceDisplay 
                          price={currentPrice} 
                          previousPrice={previousPrice} 
                          priceDirection={priceDirection}
                          symbol={symbol}
                          error={error}
                          onManualPrice={setManualPrice}
                          language={language}
                      />
                    </div>

                    <div className="card flare-border !p-4">
                      <div className="card-header">
                        <BarChart2 size={14} className="text-[var(--color-flare)]" />
                        {t('active_instrument')}
                      </div>
                      <SymbolInput symbol={symbol} onSymbolChange={setSymbol} isConnected={isConnected} onReconnect={reconnect} />
                    </div>
                    
                    <div className="reveal" style={{ animationDelay: '0.1s' }}>
                      <MarketTrends onSymbolSelect={setSymbol} language={language} />
                    </div>
                  </div>
                </div>
              )}

              {desktopActiveTab === 'analysis' && (
                <div className="space-y-12">
                  {/* ARIA Mascot Banner */}
                  <div className="flex items-center gap-8 p-6 card border-[var(--color-flare-alt)]/20" style={{borderColor: 'rgba(191,0,255,0.2)'}}>
                    <Mascot variant="analysis" size="sm" />
                    <div>
                      <p className="font-kanit text-[10px] font-bold tracking-[0.1em] text-white/30 uppercase mb-1">System Advisor</p>
                      <h2 className="font-kanit text-2xl font-black italic text-white uppercase leading-none mb-2">ARIA <span className="text-[var(--color-flare-alt)]" style={{textShadow: '0 0 20px rgba(191,0,255,0.5)'}}>X</span></h2>
                      <p className="font-inter text-sm text-white/40 uppercase tracking-widest font-medium">Tactical Analysis Engine — Đang giám sát {symbol}</p>
                    </div>
                  </div>

                  <AnalysisGlobalControls 
                    symbol={symbol}
                    onSymbolChange={setSymbol}
                    activeTimeframe={activeTimeframe}
                    onTimeframeChange={setActiveTimeframe}
                    direction={direction}
                    onDirectionChange={setDirection}
                    maAnalysis={maAnalysis}
                    language={language}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-4">
                      <EMATrendBias trends={emaTrends} />
                      <MovingAveragesPanel symbol={symbol} data={maAnalysis} loading={maLoading} onRefresh={refetchMA} activeTimeframe={activeTimeframe} language={language} />
                      <IchimokuPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
                      <DivergencePanel data={maAnalysis} activeTimeframe={activeTimeframe} />
                    </div>

                    <div className="lg:col-span-4 space-y-4">
                      <KeyLevelsPanel data={maAnalysis} activeTimeframe={activeTimeframe} />
                      <ICTKillzonesPanel language={language} />
                      <FibonacciCalculator symbol={symbol} direction={direction} maAnalysis={maAnalysis} maLoading={maLoading} onRefreshMA={refetchMA} />
                    </div>

                    <div className="lg:col-span-4 space-y-4">
                      <TradingRecommendation maAnalysis={maAnalysis} onDirectionChange={setDirection} language={language} />
                      <div className="pt-2">
                         <VolumeAnalysis symbol={symbol} maAnalysis={maAnalysis} language={language} />
                      </div>
                      <ChandelierExitPanel data={maAnalysis} activeTimeframe={activeTimeframe} language={language} />
                    </div>
                  </div>
                </div>
              )}

              {desktopActiveTab === 'bot' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-10">
                    {/* NEXUS Mascot Banner */}
                    <div className="flex items-center gap-8 p-6 card" style={{borderColor: 'rgba(0,240,255,0.2)'}}>
                      <Mascot variant="bot" size="sm" />
                      <div>
                        <p className="font-kanit text-[10px] font-bold tracking-[0.1em] text-white/30 uppercase mb-1">Automated Warrior</p>
                        <h2 className="font-kanit text-2xl font-black italic text-white uppercase leading-none mb-2">NEXUS <span className="text-[var(--color-long)]" style={{textShadow: '0 0 20px rgba(0,240,255,0.5)'}}>BOT</span></h2>
                        <p className="font-inter text-sm text-white/40 uppercase tracking-widest font-medium">Protocol: 6-Combo Strategy v2 — Chiến thần đang tuần tra thị trường</p>
                      </div>
                    </div>

                    <div className="h-[700px] card !p-0 overflow-hidden border-none shadow-2xl">
                      <HistoryDashboard symbol={symbol} language={language} />
                    </div>
                    <GoldenHourAnalysis bestHours={bestHours} strategyStats={strategyStats} language={language} />
                  </div>
                  <div className="lg:col-span-4 space-y-10">
                    <TradeAnalytics language={language} />
                  </div>
                </div>
              )}

              {desktopActiveTab === 'dex' && (
                <div className="reveal">
                  <DexTrendingPanel language={language} />
                </div>
              )}

            </div>
          </main>
        </div>

        {/* Footer - Minimal & Platinum */}
        <footer className="py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex-shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-[var(--color-silver)] uppercase tracking-[0.3em] opacity-40">
              © 2026 Anh Duc Trader  //  PRO-PROTOCOLS  //  {t('no_financial_advice')}
            </p>
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
      <div className="w-full min-h-screen bg-[var(--color-bg-primary)] overflow-y-auto">
        <Auth />
      </div>
    );
  }

  return isMobileView ? renderMobileView() : renderDesktopView();
}

export default App;
