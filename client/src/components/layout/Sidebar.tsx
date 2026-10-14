import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Smartphone,
  CreditCard,
  AlertTriangle,
  FileSpreadsheet,
  History,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface SidebarProps {
  exceptionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ exceptionCount = 0 }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ledger', label: 'Monthly Ledger', icon: CalendarDays },
    { to: '/students', label: 'Students & Batches', icon: Users },
    { to: '/evidence', label: 'Share to Rivo', icon: Smartphone, highlight: true },
    { to: '/transactions', label: 'Bank Transactions', icon: CreditCard },
    {
      to: '/exceptions',
      label: 'Exception Queue',
      icon: AlertTriangle,
      badge: exceptionCount > 0 ? exceptionCount : undefined,
    },
    { to: '/reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { to: '/audit-trail', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E2EBE5] shrink-0 min-h-[calc(100vh-61px)] p-4 justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-[#718078] tracking-wider uppercase">
          Management
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-[#15966A] text-white shadow-xs font-semibold'
                    : item.highlight
                    ? 'bg-[#DDF7E9]/60 text-[#15966A] hover:bg-[#DDF7E9]'
                    : 'text-[#26352E] hover:bg-[#F7FCF9] hover:text-[#15966A]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-[#15966A]'
                          : 'text-[#718078] group-hover:text-[#15966A]'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-bold',
                        isActive ? 'bg-white text-[#C24141]' : 'bg-red-100 text-[#C24141]'
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Trust & Safety Mini Banner */}
      <div className="bg-[#F7FCF9] p-3.5 rounded-2xl border border-[#E2EBE5] text-xs text-[#718078] space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-[#26352E]">
          <ArrowRightLeft className="w-3.5 h-3.5 text-[#15966A]" />
          <span>Safe Bookkeeping</span>
        </div>
        <p className="leading-relaxed">
          Rivo never holds or moves money. Transactions require bank or teacher verification.
        </p>
      </div>
    </aside>
  );
};
