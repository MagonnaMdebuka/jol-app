import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, BadgeCheck } from 'lucide-react';
import type { IListingWithDistance } from '../../types/listing.types';
import Badge from '../ui/Badge';
import { useSaved } from '../../contexts/SavedContext';

// Check if listing is owner-verified (not from OSM/Google)
const isVerified = (listing: IListingWithDistance): boolean =>
  !listing.id.startsWith('osm-') && !!listing.owner_id;

interface IListingCardProps {
  listing: IListingWithDistance;
  onSave?: () => void;
  saved?: boolean;
}

const fmtDistance = (m: number): string => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)} km`);

const MonoMeta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="text-[10px] text-nz-muted/80 uppercase tracking-wider"
    style={{ fontFamily: '"JetBrains Mono", monospace' }}
  >
    {children}
  </span>
);

// ──────────────────────────────────────────────
// Featured card — full bleed, 320px tall
// ──────────────────────────────────────────────
export const FeaturedCard: React.FC<IListingCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(listing.id);

  const handleClick = useCallback(() => navigate(`/listing/${listing.id}`), [navigate, listing.id]);
  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSave(listing.id);
    },
    [toggleSave, listing.id],
  );

  return (
    <article
      onClick={handleClick}
      className="relative h-[320px] rounded-[22px] overflow-hidden cursor-pointer group"
      style={{ animation: 'nz-slideup 280ms cubic-bezier(0.2,0.9,0.2,1) both' }}
    >
      {listing.images[0] ? (
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          style={{ filter: 'saturate(1.05) contrast(1.02)' }}
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-nz-elevated" />
      )}

      {/* Warm colour overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(22,17,12,0.08)' }} />

      {/* Bottom gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(22,17,12,0) 20%, rgba(16,10,5,0.93) 100%)',
        }}
      />

      {/* TypeMark top-left */}
      <div className="absolute top-3 left-3">
        <Badge variant={listing.type} />
      </div>

      {/* Heart save button top-right */}
      <button
        onClick={handleSave}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-nz-bg/60 backdrop-blur-sm border border-nz-border/40 flex items-center justify-center transition-all duration-200 hover:bg-nz-bg/80"
        aria-label={saved ? 'Remove from saved' : 'Save'}
      >
        <Heart size={16} className={saved ? 'text-nz-accent fill-nz-accent' : 'text-white'} />
      </button>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <div className="flex items-center gap-2 mb-1">
          {listing.when_chip && <MonoMeta>{listing.when_chip}</MonoMeta>}
          {listing.distance_metres !== undefined && (
            <MonoMeta>· {fmtDistance(listing.distance_metres)}</MonoMeta>
          )}
        </div>
        <h3
          className="text-white leading-[0.92] tracking-[-0.04em] mb-1"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 900,
            fontSize: '36px',
          }}
        >
          {listing.title}
        </h3>
        {listing.venue_name && (
          <p className="text-white/60 text-xs font-medium">{listing.venue_name}</p>
        )}
      </div>
    </article>
  );
};

// ──────────────────────────────────────────────
// Tile card — 200px wide, horizontal scroll
// ──────────────────────────────────────────────
export const TileCard: React.FC<IListingCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(listing.id);

  const handleClick = useCallback(() => navigate(`/listing/${listing.id}`), [navigate, listing.id]);
  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSave(listing.id);
    },
    [toggleSave, listing.id],
  );

  return (
    <article
      onClick={handleClick}
      className="w-[200px] shrink-0 bg-nz-surface border border-nz-border rounded-[18px] overflow-hidden cursor-pointer hover:border-nz-muted/40 transition-all duration-200 group"
    >
      {/* Photo */}
      <div className="relative h-[144px] overflow-hidden">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
            style={{ filter: 'saturate(1.05) contrast(1.02)' }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-nz-elevated" />
        )}
        <div className="absolute top-2 left-2">
          <Badge variant={listing.type} />
        </div>
        <button
          onClick={handleSave}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-nz-bg/60 backdrop-blur-sm border border-nz-border/40 flex items-center justify-center"
          aria-label={saved ? 'Remove from saved' : 'Save'}
        >
          <Heart size={12} className={saved ? 'text-nz-accent fill-nz-accent' : 'text-white'} />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1 mb-0.5">
          <p
            className="text-nz-text leading-snug line-clamp-2"
            style={{
              fontFamily: '"Bricolage Grotesque", system-ui',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            {listing.title}
          </p>
          {isVerified(listing) && <BadgeCheck size={12} className="text-emerald-400 shrink-0" />}
        </div>
        {listing.venue_name && (
          <p className="text-nz-muted text-[11px] truncate mb-1">{listing.venue_name}</p>
        )}
        {listing.cuisine_type && !listing.venue_name && (
          <p className="text-nz-muted text-[11px] truncate mb-1">{listing.cuisine_type}</p>
        )}
        <div className="flex items-center gap-1.5">
          {listing.distance_metres !== undefined && (
            <MonoMeta>{fmtDistance(listing.distance_metres)}</MonoMeta>
          )}
        </div>
      </div>
    </article>
  );
};

// ──────────────────────────────────────────────
// Row card — full-width, horizontal layout
// ──────────────────────────────────────────────
export const RowCard: React.FC<IListingCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(listing.id);

  const handleClick = useCallback(() => navigate(`/listing/${listing.id}`), [navigate, listing.id]);
  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSave(listing.id);
    },
    [toggleSave, listing.id],
  );

  return (
    <article
      onClick={handleClick}
      className="flex items-center gap-3 bg-nz-surface border border-nz-border rounded-[18px] p-3 cursor-pointer hover:border-nz-muted/40 transition-all duration-200"
    >
      {/* Photo */}
      <div className="relative shrink-0 w-[92px] h-[92px] rounded-[12px] overflow-hidden">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.05) contrast(1.02)' }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-nz-elevated" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant={listing.type} />
          {isVerified(listing) && (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
              <BadgeCheck size={12} />
            </span>
          )}
          {listing.distance_metres !== undefined && (
            <MonoMeta>{fmtDistance(listing.distance_metres)}</MonoMeta>
          )}
        </div>
        <p
          className="text-nz-text leading-snug line-clamp-2 mb-0.5"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 700,
            fontSize: '16px',
          }}
        >
          {listing.title}
        </p>
        {listing.venue_name && (
          <p className="text-nz-muted text-[11px] truncate">{listing.venue_name}</p>
        )}
        {listing.cuisine_type && !listing.venue_name && (
          <p className="text-nz-muted text-[11px] truncate">{listing.cuisine_type}</p>
        )}
        {listing.when_chip && (
          <p className="text-nz-accent text-[11px] font-semibold mt-0.5">{listing.when_chip}</p>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="shrink-0 w-8 h-8 rounded-full bg-nz-elevated flex items-center justify-center transition-all duration-200"
        aria-label={saved ? 'Remove from saved' : 'Save'}
      >
        <Heart size={14} className={saved ? 'text-nz-accent fill-nz-accent' : 'text-nz-muted'} />
      </button>
    </article>
  );
};

// Default export — backwards-compatible (renders RowCard)
const ListingCard: React.FC<IListingCardProps> = (props) => <RowCard {...props} />;

export default ListingCard;
