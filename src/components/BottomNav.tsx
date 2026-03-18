import { LayoutDashboard, Microscope, Bot, Activity } from 'lucide-react';

export type TabType = 'overview' | 'analysis' | 'bot' | 'dex';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'analysis' as TabType, label: 'Phân tích', icon: Microscope },
    { id: 'bot' as TabType, label: 'Bot Trade', icon: Bot },
    { id: 'dex' as TabType, label: 'DEX Pulse', icon: Activity },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[var(--color-bg-secondary)]/95 backdrop-blur-xl border-t border-[var(--color-border)] px-2 py-3 z-50 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
              isActive 
                ? 'text-[var(--color-flare)]' 
                : 'text-[var(--color-silver)] hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-[2px] transition-all transform ${isActive ? 'bg-[var(--color-flare)]/10 scale-110' : 'group-hover:scale-105'}`}>
              <Icon size={18} strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
