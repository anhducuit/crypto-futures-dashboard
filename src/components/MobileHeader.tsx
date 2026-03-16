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
    <header className="sticky top-0 z-50 glass-luxury border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
      {/* Left: Account Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[2px] bg-[var(--color-flare)] flex items-center justify-center text-black font-black shadow-lg shadow-[var(--color-flare-glow)]">
          {accountName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[120px]">
            {accountName}
          </span>
          <span className="text-[9px] text-[var(--color-silver)] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--color-long)] animate-signal' : 'bg-[var(--color-short)]'}`}></span>
            {isConnected ? 'NODE CONNECTED' : 'SYSTEM OFFLINE'}
          </span>
        </div>
      </div>

      {/* Right: Network & Logout */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-[2px] text-[10px] font-black uppercase tracking-widest text-[var(--color-silver)] hover:bg-[var(--color-flare)] hover:text-black transition-all">
          <Globe size={14} />
          <span className="hidden xs:inline">Crypto</span>
        </button>
        
        <button 
          onClick={handleLogout}
          className="p-1.5 text-[var(--color-silver)] hover:text-[var(--color-short)] transition-all duration-300 transform hover:translate-x-1"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
