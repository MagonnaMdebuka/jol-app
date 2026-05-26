import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useListings } from '../contexts/ListingsContext';
import { useNearbyListings } from '../hooks/useNearbyListings';
import MapView from '../components/map/MapView';
import MapFilters from '../components/map/MapFilters';
import BottomSheet from '../components/ui/BottomSheet';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useSaved } from '../contexts/SavedContext';
import type { IListingWithDistance } from '../types/listing.types';

const fmtDistance = (m: number): string =>
  m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)} km`;

const DiscoveryMap: React.FC = () => {
  const { filteredListings, loading, filters, userLat, userLng } = useListings();
  const nearbyListings = useNearbyListings(filteredListings, userLat, userLng, filters.radius);
  const [selected, setSelected] = useState<IListingWithDistance | null>(null);
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();

  const handleSelectListing = useCallback((listing: IListingWithDistance) => {
    setSelected(listing);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  const handleSave = useCallback(() => {
    if (selected) toggleSave(selected.id);
  }, [selected, toggleSave]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-nz-bg gap-4">
        <Spinner size="lg" />
        <p className="text-nz-muted text-sm">Finding spots near you…</p>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      {/* Floating logo card — top left */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div
          className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          style={{
            background: 'rgba(30,22,16,0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(245,236,217,0.08)',
          }}
        >
          <div className="flex flex-col leading-none">
            <span
              className="text-nz-text leading-none mb-0.5"
              style={{
                fontFamily: '"Bricolage Grotesque", system-ui',
                fontWeight: 800,
                fontSize: '16px',
              }}
            >
              Tonight, Joburg
            </span>
            <span
              className="text-nz-muted"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                letterSpacing: '0.04em',
              }}
            >
              {nearbyListings.length} SPOTS
            </span>
          </div>
        </div>
      </div>

      {/* Map canvas */}
      <MapView listings={nearbyListings} onSelectListing={handleSelectListing} />

      {/* Vibe filter rail — bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1000] px-4 pb-4 pt-6 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(22,17,12,0.85) 0%, transparent 100%)' }}
      >
        <MapFilters />
      </div>

      {/* Bottom sheet for selected listing */}
      {selected && (
        <BottomSheet open={!!selected} onClose={handleClose} defaultSnap="partial">
          {/* Peek card — thumbnail left, info right */}
          <div className="flex items-center gap-3">
            {selected.images[0] && (
              <img
                src={selected.images[0]}
                alt={selected.title}
                className="w-[72px] h-[72px] rounded-[12px] object-cover shrink-0"
                style={{ filter: 'saturate(1.05) contrast(1.02)' }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Badge variant={selected.type} />
                {selected.distance_metres !== undefined && (
                  <span
                    className="text-nz-muted"
                    style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px' }}
                  >
                    {fmtDistance(selected.distance_metres)}
                  </span>
                )}
              </div>
              <p
                className="text-nz-text leading-snug line-clamp-2"
                style={{
                  fontFamily: '"Bricolage Grotesque", system-ui',
                  fontWeight: 800,
                  fontSize: '18px',
                }}
              >
                {selected.title}
              </p>
              {selected.venue_name && (
                <p className="text-nz-muted text-xs mt-0.5">{selected.venue_name}</p>
              )}
              {selected.when_chip && (
                <p className="text-nz-accent text-[11px] font-semibold mt-0.5">{selected.when_chip}</p>
              )}
            </div>
            <button
              onClick={handleSave}
              className="shrink-0 w-9 h-9 rounded-full bg-nz-elevated border border-nz-border flex items-center justify-center"
              aria-label={isSaved(selected.id) ? 'Remove from saved' : 'Save'}
            >
              <Heart
                size={15}
                className={
                  isSaved(selected.id) ? 'text-nz-accent fill-nz-accent' : 'text-nz-muted'
                }
              />
            </button>
          </div>

          <div className="mt-4">
            <Button
              onClick={() => navigate(`/listing/${selected.id}`)}
              size="lg"
              className="w-full"
            >
              View full details
            </Button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default DiscoveryMap;
