import React, { type ReactNode } from 'react';

interface IChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: string;
  className?: string;
}

const Chip: React.FC<IChipProps> = ({ active, onClick, children, icon, className = '' }) => (
  <button
    onClick={onClick}
    type="button"
    className={`
      shrink-0 inline-flex items-center gap-1.5
      px-3.5 py-2 rounded-full text-[13px] font-semibold
      border whitespace-nowrap cursor-pointer
      transition-all duration-150 active:scale-[0.96]
      ${
        active
          ? 'bg-nz-text text-nz-bg border-transparent'
          : 'bg-nz-surface text-nz-muted border-nz-border hover:text-nz-text'
      }
      ${className}
    `}
  >
    {icon && <span className="text-[11px]">{icon}</span>}
    {children}
  </button>
);

export default Chip;
