import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: [
    'bg-nz-accent text-white font-bold',
    'shadow-[0_2px_0_rgba(0,0,0,0.15)]',
    'hover:brightness-110',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed',
  ].join(' '),
  secondary: [
    'bg-nz-elevated border border-nz-border',
    'text-nz-text hover:text-nz-text',
    'hover:border-nz-muted/40',
    'active:scale-[0.98]',
  ].join(' '),
  ghost: [
    'text-nz-muted hover:text-nz-text',
    'hover:bg-white/5',
    'active:scale-[0.98]',
  ].join(' '),
  danger: [
    'bg-red-600/90 border border-red-500/40',
    'text-white hover:bg-red-500',
    'shadow-[0_4px_16px_rgba(239,68,68,0.2)]',
    'hover:shadow-[0_4px_20px_rgba(239,68,68,0.35)]',
    'active:scale-[0.98]',
  ].join(' '),
  whatsapp: [
    'bg-[#25D366] text-white font-bold',
    'shadow-[0_2px_0_rgba(0,0,0,0.15)]',
    'hover:brightness-110',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs gap-1.5 rounded-xl',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3.5 text-sm gap-2 rounded-2xl',
};

const Button: React.FC<IButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center font-medium
      transition-all duration-200 cursor-pointer select-none
      ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}
    `}
  >
    {loading ? (
      <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    ) : (
      icon && <span className="shrink-0">{icon}</span>
    )}
    {children}
    {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
  </button>
);

export default Button;
