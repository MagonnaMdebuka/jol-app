import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Users, Shirt } from 'lucide-react';
import Badge from '../ui/Badge';
import type { ListingType, DressCode, PriceRange } from '../../types/listing.types';

interface IPreviewData {
  type: ListingType;
  title: string;
  description: string;
  address: string;
  images: string[];
  // Event fields
  eventDate?: string;
  entryFee?: string;
  dressCode?: DressCode;
  artist?: string;
  ageRestriction?: string;
  tags?: string[];
  capacity?: string;
  // Food fields
  cuisineType?: string;
  openingHours?: string;
  priceRange?: PriceRange;
  special?: string;
  // Optional venue name
  venueName?: string;
}

interface IListingPreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: IPreviewData;
}

const formatEventDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const priceRangeLabels: Record<PriceRange, string> = {
  R: 'R — Budget-friendly',
  RR: 'RR — Moderate',
  RRR: 'RRR — Upscale',
  RRRR: 'RRRR — Fine dining',
};

const MonoLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    className="text-nz-muted mb-2"
    style={{
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '9px',
      letterSpacing: '0.04em',
      fontWeight: 500,
    }}
  >
    {children}
  </p>
);

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3 py-2">
    <span className="text-nz-muted mt-0.5">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-nz-muted text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-nz-text text-sm">{value}</p>
    </div>
  </div>
);

const ListingPreviewModal: React.FC<IListingPreviewModalProps> = ({ open, onClose, data }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const hasImage = data.images.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.7)]"
        style={{
          background: 'rgba(22,17,12,0.98)',
          border: '1px solid rgba(58,44,27,0.6)',
          animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-nz-bg/70 backdrop-blur-sm border border-nz-border/40 flex items-center justify-center text-nz-muted hover:text-nz-text transition-colors"
          type="button"
        >
          <X size={16} />
        </button>

        {/* Hero image */}
        <div className="relative h-[240px] overflow-hidden rounded-t-3xl">
          {hasImage ? (
            <img
              src={data.images[0]}
              alt={data.title}
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(1.05) contrast(1.02)' }}
            />
          ) : (
            <div className="w-full h-full bg-nz-elevated flex items-center justify-center">
              <span className="text-nz-muted/40 text-4xl">✦</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(22,17,12,0) 40%, rgba(22,17,12,0.95) 100%)',
            }}
          />
          {/* Badge */}
          <div className="absolute top-4 left-4">
            <Badge variant={data.type} />
          </div>
          {/* Title over image */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <h2
              className="text-nz-text leading-[0.94] tracking-[-0.04em]"
              style={{
                fontFamily: '"Bricolage Grotesque", system-ui',
                fontWeight: 900,
                fontSize: '28px',
              }}
            >
              {data.title || 'Untitled'}
            </h2>
            {data.venueName && <p className="text-nz-muted text-sm mt-1">{data.venueName}</p>}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <MonoLabel>PREVIEW — HOW USERS WILL SEE IT</MonoLabel>

          {/* Description */}
          {data.description && (
            <p className="text-nz-text/90 text-sm leading-relaxed mb-4">{data.description}</p>
          )}

          {/* Address */}
          <DetailRow
            icon={<MapPin size={16} />}
            label="Location"
            value={data.address || 'No address'}
          />

          {/* Event details */}
          {data.type === 'event' && (
            <>
              {data.eventDate && (
                <DetailRow
                  icon={<Calendar size={16} />}
                  label="Date & Time"
                  value={formatEventDate(data.eventDate)}
                />
              )}
              {data.entryFee && (
                <DetailRow
                  icon={<span className="text-sm font-bold">R</span>}
                  label="Entry"
                  value={data.entryFee}
                />
              )}
              {data.dressCode && data.dressCode !== 'Any' && (
                <DetailRow icon={<Shirt size={16} />} label="Dress Code" value={data.dressCode} />
              )}
              {data.capacity && (
                <DetailRow
                  icon={<Users size={16} />}
                  label="Capacity"
                  value={`${data.capacity} people`}
                />
              )}
              {data.artist && (
                <DetailRow
                  icon={<span className="text-sm">🎵</span>}
                  label="Artist / DJ"
                  value={data.artist}
                />
              )}
              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-nz-accent/15 text-nz-accent text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Food details */}
          {data.type === 'food' && (
            <>
              {data.cuisineType && (
                <DetailRow
                  icon={<span className="text-sm">🍽</span>}
                  label="Cuisine"
                  value={data.cuisineType}
                />
              )}
              {data.openingHours && (
                <DetailRow icon={<Clock size={16} />} label="Hours" value={data.openingHours} />
              )}
              {data.priceRange && (
                <DetailRow
                  icon={<span className="text-sm font-bold">R</span>}
                  label="Price Range"
                  value={priceRangeLabels[data.priceRange]}
                />
              )}
              {data.special && (
                <DetailRow
                  icon={<span className="text-sm">⭐</span>}
                  label="Special"
                  value={data.special}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-nz-elevated border border-nz-border rounded-2xl text-nz-text text-sm font-semibold hover:bg-nz-surface transition-colors"
            type="button"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingPreviewModal;
