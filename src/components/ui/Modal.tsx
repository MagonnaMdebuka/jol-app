import React, { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface IModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const Modal: React.FC<IModalProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.6)] animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          background: 'rgba(31,24,16,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(58,44,27,0.6)',
          animationFillMode: 'both',
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-nz-border" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-nz-border/40">
            <h3 className="text-base font-bold text-nz-text">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-nz-muted hover:text-nz-text hover:bg-white/5 transition-all duration-200"
              type="button"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
