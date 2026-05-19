import React, { type InputHTMLAttributes } from 'react';

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input: React.FC<IInputProps> = ({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-[9px] font-medium text-nz-muted uppercase tracking-widest"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`
          w-full bg-nz-elevated/80 border rounded-xl px-4 py-3
          text-nz-text text-sm placeholder:text-nz-muted/60
          outline-none transition-all duration-200
          focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40
          focus:bg-nz-elevated
          ${
            error
              ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
              : 'border-nz-border/60 hover:border-nz-border'
          }
          ${className}
        `}
      />
      {hint && !error && <p className="text-xs text-nz-muted/70">{hint}</p>}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
