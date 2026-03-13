import { Globe, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MobileHeaderProps {
  session: any;
  isConnected: boolean;
}

export function MobileHeader({ session, isConnected }: MobileHeaderProps) {
  const accountName = session?.user?.email?.split('@')[0] || 'User';

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-bg-secondary)]/95 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
      {/* Left: Account Info */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-golden)] to-[var(--color-golden-light)] flex items-center justify-center text-[var(--color-bg-primary)] font-bold shadow-lg">
          {accountName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold truncate max-w-[120px]">
            Account 1
          </span>
          <span className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--color-long)] animate-pulse' : 'bg-[var(--color-short)]'}`}></span>
            {isConnected ? 'Binance Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Right: Network & Menu */}
      <div className="flex items-center gap-4">
        {/* Network Button mock */}
        <button className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors border border-[rgba(255,255,255,0.05)]">
          <Globe size={14} className="text-[var(--color-text-secondary)]" />
          <span className="hidden xs:inline">Crypto</span>
        </button>
        
        {/* Menu/Logout */}
        <button 
          onClick={handleLogout}
          className="p-1.5 text-[var(--color-text-secondary)] hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
