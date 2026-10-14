import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border-2 border-dashed border-[#E2EBE5] bg-[#F7FCF9]/50">
      <div className="w-14 h-14 rounded-2xl bg-[#DDF7E9] flex items-center justify-center text-[#15966A] mb-4 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-[#26352E]">{title}</h4>
      <p className="text-sm text-[#718078] max-w-sm mt-1 mb-5">{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
};
