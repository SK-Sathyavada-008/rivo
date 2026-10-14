import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { RotateCcw, LogOut, Sparkles, Building2, User as UserIcon } from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';

interface NavbarProps {
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh }) => {
  const { user, resetDemo, logout } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetDemo = async () => {
    if (!confirm('Reset demo data back to default sample students and transactions?')) return;
    setResetting(true);
    try {
      await resetDemo();
      if (onRefresh) onRefresh();
      window.location.reload();
    } catch (e) {
      alert('Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2EBE5] px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Brand logo & Academy Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Rivo Logo" className="w-9 h-9" />
          <div className="hidden sm:block">
            <span className="text-xl font-bold tracking-tight text-[#18392D]">Rivo</span>
            <span className="text-xs text-[#718078] ml-2 font-medium">Fees in flow</span>
          </div>
        </div>

        <div className="h-5 w-px bg-[#E2EBE5] mx-1 hidden md:block" />

        {/* Current Academy Name */}
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#26352E] bg-[#F7FCF9] px-3 py-1.5 rounded-xl border border-[#E2EBE5]">
          <Building2 className="w-4 h-4 text-[#15966A]" />
          <span className="truncate max-w-[180px] sm:max-w-xs">{user?.academyName || 'Dance Academy'}</span>
        </div>
      </div>

      {/* Right Actions: Demo Badge & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user?.isDemo ? (
          <div className="flex items-center gap-2">
            <Badge variant="demo" className="hidden sm:inline-flex">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              DEMO MODE
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDemo}
              isLoading={resetting}
              className="text-xs border-[#9DE5BE] bg-[#DDF7E9]/40 text-[#15966A] hover:bg-[#DDF7E9]"
              title="Reset sample students, payments, and exceptions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Demo Data</span>
            </Button>
          </div>
        ) : null}

        <div className="flex items-center gap-2 pl-2 border-l border-[#E2EBE5]">
          <span className="text-xs text-[#718078] hidden lg:inline-block font-medium">
            {user?.name}
          </span>
          <button
            onClick={logout}
            className="p-2 text-[#718078] hover:text-[#C24141] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
