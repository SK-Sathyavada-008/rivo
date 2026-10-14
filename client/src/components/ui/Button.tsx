import React from 'react';
import { cn } from '../../lib/utils.js';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-[#15966A] text-white hover:bg-[#107854] shadow-sm',
    secondary: 'bg-[#DDF7E9] text-[#15966A] hover:bg-[#cbf1dd]',
    outline: 'bg-white border border-[#E2EBE5] text-[#26352E] hover:bg-stone-50',
    danger: 'bg-[#C24141] text-white hover:bg-[#a63333]',
    ghost: 'text-[#718078] hover:text-[#26352E] hover:bg-stone-100',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-base px-6 py-3 h-12 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : null}
      {children}
    </button>
  );
};
