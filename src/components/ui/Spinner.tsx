import React from 'react';

interface ISpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

const Spinner: React.FC<ISpinnerProps> = ({ className, size = 'md' }) => {
  const sizeClass = className ?? SIZE_MAP[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className={`animate-spin ${sizeClass}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        {/* Track */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          className="text-white/10"
        />
        {/* Arc — brand orange gradient effect via stroke */}
        <path
          d="M4 12a8 8 0 018-8"
          stroke="url(#spinner-grad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="spinner-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Spinner;
