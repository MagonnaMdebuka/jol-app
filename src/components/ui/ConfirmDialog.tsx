import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface IConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

/**
 * Confirmation dialog for destructive actions.
 * Use this before deleting items, removing data, or other irreversible operations.
 */
const ConfirmDialog: React.FC<IConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => (
  <Modal open={open} onClose={onClose}>
    <div className="flex flex-col items-center text-center">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
          variant === 'danger'
            ? 'bg-red-500/15 border border-red-500/30'
            : 'bg-amber-500/15 border border-amber-500/30'
        }`}
      >
        <AlertTriangle
          size={24}
          className={variant === 'danger' ? 'text-red-400' : 'text-amber-400'}
        />
      </div>

      <h3
        className="text-nz-text text-lg font-bold mb-2"
        style={{ fontFamily: '"Bricolage Grotesque", system-ui' }}
      >
        {title}
      </h3>

      <p className="text-nz-muted text-sm mb-6 max-w-xs">{message}</p>

      <div className="flex gap-3 w-full">
        <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          className="flex-1"
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
