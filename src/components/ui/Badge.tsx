import React, { type ReactNode } from 'react';

type BadgeVariant =
  | 'event'
  | 'food'
  | 'active'
  | 'inactive'
  | 'review'
  | 'verified'
  | 'default'
  | 'neutral'
  | 'accent';

interface IBadgeProps {
  variant?: BadgeVariant;
  children?: ReactNode;
  className?: string;
  /** Kept for backwards compatibility — ignored in new design */
  gradient?: boolean;
}

const STYLES: Record<BadgeVariant, string> = {
  event: 'bg-nz-accent text-[#1a0e08]',
  food: 'bg-nz-apricot text-[#1a0e08]',
  active: 'bg-green-500/20 text-green-400 border border-green-500/30',
  inactive: 'bg-nz-elevated text-nz-muted border border-nz-border',
  review: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  verified: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  default: 'bg-nz-elevated text-nz-muted border border-nz-border',
  neutral: 'bg-nz-elevated text-nz-muted border border-nz-border',
  accent: 'bg-nz-accent-soft text-nz-accent-text',
};

const TYPE_MARK_LABELS: Partial<Record<BadgeVariant, string>> = {
  event: '◈ Go out',
  food: '⌇ Eat',
};

const Badge: React.FC<IBadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  gradient: _gradient,
}) => {
  const label = children ?? TYPE_MARK_LABELS[variant];

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-[11px] font-bold tracking-wide
        ${STYLES[variant]} ${className}
      `}
    >
      {label}
    </span>
  );
};

export default Badge;
