import React from 'react';
import { cn } from '../../lib/utils.js';

interface BadgeProps {
  variant?:
    | 'paid'
    | 'partially_paid'
    | 'unpaid'
    | 'overpaid'
    | 'teacher_verified'
    | 'provider_verified'
    | 'pending_review'
    | 'claimed'
    | 'rejected'
    | 'reversed'
    | 'demo'
    | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  const getStyles = () => {
    switch (variant) {
      case 'paid':
      case 'teacher_verified':
      case 'provider_verified':
        return 'bg-[#DDF7E9] text-[#15966A] border-[#9DE5BE]';
      case 'partially_paid':
        return 'bg-amber-50 text-[#B7791F] border-amber-200';
      case 'unpaid':
        return 'bg-stone-100 text-[#718078] border-[#E2EBE5]';
      case 'overpaid':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'pending_review':
      case 'claimed':
        return 'bg-amber-50 text-[#B7791F] border-amber-300';
      case 'rejected':
      case 'reversed':
        return 'bg-red-50 text-[#C24141] border-red-200';
      case 'demo':
        return 'bg-emerald-950 text-emerald-200 border-emerald-800 font-semibold tracking-wide';
      case 'neutral':
      default:
        return 'bg-white text-[#26352E] border-[#E2EBE5]';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors',
        getStyles(),
        className
      )}
    >
      {children}
    </span>
  );
};
