import React from 'react';

interface IMonoLabelProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'label';
  htmlFor?: string;
}

/**
 * Mono-spaced uppercase label used for section headers and metadata.
 * Follows the JetBrains Mono typography pattern from the design system.
 */
const MonoLabel: React.FC<IMonoLabelProps> = ({
  children,
  className = '',
  as: Component = 'p',
  htmlFor,
}) => (
  <Component
    className={`text-nz-muted font-mono text-[10px] font-medium uppercase tracking-widest ${className}`}
    {...(Component === 'label' && htmlFor ? { htmlFor } : {})}
  >
    {children}
  </Component>
);

export default MonoLabel;
