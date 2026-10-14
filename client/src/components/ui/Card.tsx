import React from 'react';
import { cn } from '../../lib/utils.js';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#E2EBE5] p-5 shadow-[0_2px_8px_rgba(24,57,45,0.04)] transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
