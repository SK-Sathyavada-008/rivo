import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Smartphone,
  AlertTriangle,
  Menu,
  Users,
  CreditCard,
  FileSpreadsheet,
  History,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface MobileBottomNavProps {
  exceptionCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ exceptionCount = 0 }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const moreItems = [
    { to: '/students', label: 'Students & Batches', icon: Users, desc: 'Manage student roster and class batches' },
    { to: '/transactions', label: 'Bank Transactions', icon: CreditCard, desc: 'Import CSV and verify statement records' },
    { to: '/reports', label: 'Reports & Export', icon: FileSpreadsheet, desc: 'Monthly collections and CSV downloads' },
    { to: '/audit-trail', label: 'Audit Trail', icon: History, desc: 'Immutable timeline of teacher actions' },
  ];

  return (
    <>
      {/* Mobile Drawer for More Items */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl border-t border-[#E2EBE5] p-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE5]">
              <span className="font-bold text-base text-[#26352E]">All Modules</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 text-[#718078] hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid gap-3 py-4">
              {moreItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3.5 p-3 rounded-2xl border border-[#E2EBE5] hover:bg-[#F7FCF9] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#DDF7E9] flex items-center justify-center text-[#15966A] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#26352E]">{item.label}</div>
                      <div className="text-xs text-[#718078]">{item.desc}</div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Persistent Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2EBE5] px-2 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 items-center justify-items-center">
          {/* 1. Dashboard */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors',
                isActive ? 'text-[#15966A] font-bold' : 'text-[#718078]'
              )
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          {/* 2. Ledger */}
          <NavLink
            to="/ledger"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors',
                isActive ? 'text-[#15966A] font-bold' : 'text-[#718078]'
              )
            }
          >
            <CalendarDays className="w-5 h-5" />
            <span>Ledger</span>
          </NavLink>

          {/* 3. Share to Rivo (Center prominent action button) */}
          <NavLink
            to="/evidence"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full shadow-md transition-all',
                isActive
                  ? 'bg-[#18392D] text-white ring-4 ring-[#DDF7E9]'
                  : 'bg-[#15966A] text-white ring-4 ring-white hover:bg-[#107854]'
              )
            }
            title="Share to Rivo / Evidence Entry"
          >
            <Smartphone className="w-6 h-6" />
          </NavLink>

          {/* 4. Exceptions */}
          <NavLink
            to="/exceptions"
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors',
                isActive ? 'text-[#15966A] font-bold' : 'text-[#718078]'
              )
            }
          >
            <div className="relative">
              <AlertTriangle className="w-5 h-5" />
              {exceptionCount > 0 ? (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#C24141] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {exceptionCount}
                </span>
              ) : null}
            </div>
            <span>Alerts</span>
          </NavLink>

          {/* 5. Menu / More */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium text-[#718078] hover:text-[#26352E] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
