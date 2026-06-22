/**
 * Header row for listing forms (close button, title, action button)
 */
import React from 'react';
import { X } from 'lucide-react';

interface IListingFormHeaderProps {
  label: string;
  actionLabel: string;
  onClose: () => void;
  onAction: () => void;
}

const ListingFormHeader: React.FC<IListingFormHeaderProps> = ({
  label,
  actionLabel,
  onClose,
  onAction,
}) => (
  <div className="flex items-center justify-between">
    <button
      type="button"
      onClick={onClose}
      className="w-9 h-9 rounded-full bg-nz-elevated border border-nz-border flex items-center justify-center text-nz-muted hover:text-nz-text transition-colors"
      aria-label="Close"
    >
      <X size={16} />
    </button>
    <p
      className="text-nz-muted"
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </p>
    <button type="button" onClick={onAction} className="text-nz-accent text-sm font-bold">
      {actionLabel}
    </button>
  </div>
);

export default ListingFormHeader;
