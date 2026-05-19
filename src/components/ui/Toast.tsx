import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface IToast {
  id: string;
  message: string;
  type: ToastType;
}

interface IToastContext {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<IToastContext | null>(null);

const ICONS = { success: CheckCircle, error: XCircle, info: AlertCircle };

const BORDER_COLOURS: Record<ToastType, string> = {
  success: 'border-l-green-400',
  error: 'border-l-red-500',
  info: 'border-l-nz-accent',
};

const ICON_COLOURS: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-nz-accent',
};

const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<IToast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2.5 w-full max-w-sm px-5 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`
                flex items-center gap-3 px-4 py-3.5
                backdrop-blur-xl
                border border-l-2 ${BORDER_COLOURS[t.type]}
                rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                pointer-events-auto
                animate-[slideInFromBottom_0.3s_cubic-bezier(0.34,1.56,0.64,1)]
              `}
              style={{
                background: 'rgba(31,24,16,0.96)',
                borderColor: 'rgba(58,44,27,0.5)',
              }}
            >
              <Icon size={18} className={`shrink-0 ${ICON_COLOURS[t.type]}`} />
              <span className="text-sm text-nz-text flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-nz-muted hover:text-nz-text transition-colors p-0.5"
                type="button"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;

export const useToast = (): IToastContext => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
