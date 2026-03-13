import { LayoutDashboard, History, Zap, Settings } from 'lucide-react';

export type TabType = 'trade' | 'history' | 'bots' | 'menu';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'trade' as TabType, label: 'Giao dịch', icon: LayoutDashboard },
    { id: 'history' as TabType, label: 'Lệnh', icon: History },
    { id: 'bots' as TabType, label: 'Bot Phân Tích', icon: Zap },
    { id: 'menu' as TabType, label: 'Mở Rộng', icon: Settings },
  ];

  return (
    <nav className="sticky bottom-0 left-0 w-full bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] px-2 py-2.5 z-50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive 
                ? 'text-[var(--color-golden)] font-semibold' 
                : 'text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[var(--color-golden)]/10' : ''}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] leading-none uppercase tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
