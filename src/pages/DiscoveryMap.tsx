import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Heart, MapPin, Navigation } from 'lucide-react';
import { useListings } from '../contexts/ListingsContext';
import { useNearbyListings } from '../hooks/useNearbyListings';
import { GAUTENG_CENTER } from '../constants/mapConfig';
import MapView from '../components/map/MapView';
import MapFilters from '../components/map/MapFilters';
import BottomSheet from '../components/ui/BottomSheet';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useSaved } from '../contexts/SavedContext';
import { fmtDistance } from '../utils/geo';
import type { IListingWithDistance } from '../types/listing.types';
import { formatOsmCategory, overpassAreaSearch, type IOsmPlace } from '../services/osm.service';

const EXTERNAL_PREFIX = 'osm-';

const isNightlifeCategory = (category: string): boolean =>
  ['nightclub', 'bar', 'pub', 'lounge', 'casino', 'theatre', 'cinema'].includes(category);

const isExternalListing = (listing: IListingWithDistance): boolean =>
  listing.id.startsWith(EXTERNAL_PREFIX);

const osmPlaceToListing = (place: IOsmPlace): IListingWithDistance => ({
  id: `${EXTERNAL_PREFIX}${place.osm_type}-${place.osm_id}`,
  venue_id: `${EXTERNAL_PREFIX}${place.osm_type}-${place.osm_id}`,
  owner_id: 'external-osm',
  type: isNightlifeCategory(place.amenity) ? 'event' : 'food',
  title: place.name,
  description: null,
  address: place.address,
  location: { lat: place.lat, lng: place.lng },
  images: [],
  status: 'active',
  view_count: 0,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  event_date: null,
  event_end_date: null,
  entry_fee: null,
  dress_code: null,
  artist: null,
  age_restriction: null,
  tags: null,
  capacity: null,
  cuisine_type: place.cuisine,
  opening_hours: null,
  price_range: null,
  special: null,
  vibe: ['Not on Jol'],
  when_chip: 'OpenStreetMap',
  distance_metres: place.distance_metres ?? 0,
  venue_name: formatOsmCategory(place.amenity, place.cuisine),
});

const buildRegisterUrl = (listing: IListingWithDistance): string => {
  const params = new URLSearchParams({ name: listing.title, address: listing.address });
  return `/owner/register?${params.toString()}`;
};

interface IExternalPlaceSheetProps {
  listing: IListingWithDistance;
  onDirections: () => void;
  onAddToJol: () => void;
}

const ExternalPlaceSheet: React.FC<IExternalPlaceSheetProps> = ({
  listing,
  onDirections,
  onAddToJol,
}) => (
  <div className="pt-1">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-2xl bg-nz-elevated border border-nz-border flex items-center justify-center shrink-0">
        <MapPin size={24} className="text-nz-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="neutral">Not on Jol</Badge>
          {listing.distance_metres !== undefined && (
            <span
              className="text-nz-muted"
              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px' }}
            >
              {fmtDistance(listing.distance_metres)}
            </span>
          )}
        </div>
        <h2
          className="text-nz-text leading-tight"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 900,
            fontSize: '24px',
          }}
        >
          {listing.title}
        </h2>
        {listing.venue_name && (
          <p className="text-nz-accent text-xs font-semibold mt-1">{listing.venue_name}</p>
        )}
      </div>
    </div>

    <div className="mt-5 rounded-2xl bg-nz-surface border border-nz-border p-4">
      <p
        className="text-nz-muted mb-1"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          letterSpacing: '0.04em',
        }}
      >
        ADDRESS
      </p>
      <p className="text-nz-text text-sm leading-relaxed">{listing.address}</p>
    </div>

    <div className="mt-4 flex flex-col gap-2.5">
      <Button onClick={onDirections} size="lg" className="w-full" icon={<Navigation size={16} />}>
        Directions
      </Button>
      <Button
        onClick={onAddToJol}
        size="lg"
        variant="secondary"
        className="w-full"
        icon={<ExternalLink size={16} />}
      >
        Add this venue to Jol
      </Button>
    </div>
  </div>
);

const DiscoveryMap: React.FC = () => {
  const { filteredListings, loading, filters, userLat, userLng } = useListings();
  const nearbyListings = useNearbyListings(
    filteredListings,
    userLat,
    userLng,
    filters.radius,
    filters.sortBy,
  );
  const [selected, setSelected] = useState<IListingWithDistance | null>(null);
  const [osmFallbackListings, setOsmFallbackListings] = useState<IListingWithDistance[]>([]);
  const [osmFallbackLoading, setOsmFallbackLoading] = useState(false);
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();
  const usingOsmFallback = !loading && nearbyListings.length === 0;
  const displayListings = usingOsmFallback ? osmFallbackListings : nearbyListings;
  const selectedIsExternal = selected ? isExternalListing(selected) : false;

  useEffect(() => {
    if (!usingOsmFallback) {
      setOsmFallbackListings([]);
      return;
    }

    let cancelled = false;
    const fetchFallbackPlaces = async (): Promise<void> => {
      setOsmFallbackLoading(true);
      const centerLat = userLat ?? GAUTENG_CENTER.lat;
      const centerLng = userLng ?? GAUTENG_CENTER.lng;

      try {
        const places = await overpassAreaSearch(
          centerLat,
          centerLng,
          centerLat,
          centerLng,
          true,
          40,
          null,
          Math.max(filters.radius, 6000),
        );
        if (!cancelled) {
          setOsmFallbackListings(
            places
              .sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0))
              .map(osmPlaceToListing),
          );
        }
      } catch {
        if (!cancelled) setOsmFallbackListings([]);
      } finally {
        if (!cancelled) setOsmFallbackLoading(false);
      }
    };

    void fetchFallbackPlaces();
    return () => {
      cancelled = true;
    };
  }, [filters.radius, usingOsmFallback, userLat, userLng]);

  const handleSelectListing = useCallback((listing: IListingWithDistance) => {
    setSelected(listing);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  const handleSave = useCallback(() => {
    if (selected) toggleSave(selected.id);
  }, [selected, toggleSave]);

  const handleDirections = useCallback(() => {
    if (!selected) return;
    const { lat, lng } = selected.location;
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  }, [selected]);

  const handleAddExternalPlace = useCallback(() => {
    if (!selected) return;
    navigate(buildRegisterUrl(selected));
  }, [navigate, selected]);

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
              {osmFallbackLoading ? 'LOADING PLACES' : `${displayListings.length} SPOTS`}
            </span>
          </div>
        </div>
      </div>

      {/* Map canvas */}
      <MapView listings={displayListings} onSelectListing={handleSelectListing} />

      {/* Vibe filter rail — bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1000] px-4 pb-3 pt-8 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(22,17,12,0.9) 0%, transparent 100%)' }}
      >
        <MapFilters />
      </div>

      {/* Bottom sheet for selected listing */}
      {selected && (
        <BottomSheet open={!!selected} onClose={handleClose} defaultSnap="partial">
          {selectedIsExternal ? (
            <ExternalPlaceSheet
              listing={selected}
              onDirections={handleDirections}
              onAddToJol={handleAddExternalPlace}
            />
          ) : (
            <>
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
                    <p className="text-nz-accent text-[11px] font-semibold mt-0.5">
                      {selected.when_chip}
                    </p>
                  )}
                </div>
                {selectedIsExternal ? (
                  <div className="shrink-0">
                    <Badge variant="neutral">Not on Jol</Badge>
                  </div>
                ) : (
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
                )}
              </div>

              {selectedIsExternal ? (
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={handleDirections}
                    size="lg"
                    className="flex-1"
                    icon={<MapPin size={16} />}
                  >
                    Directions
                  </Button>
                  <Button
                    onClick={() => navigate(buildRegisterUrl(selected))}
                    size="lg"
                    variant="secondary"
                    className="flex-1"
                    icon={<ExternalLink size={16} />}
                  >
                    Add to Jol
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <Button
                    onClick={() => navigate(`/listing/${selected.id}`)}
                    size="lg"
                    className="w-full"
                  >
                    View full details
                  </Button>
                </div>
              )}
            </>
          )}
        </BottomSheet>
      )}
    </div>
  );
};

export default DiscoveryMap;
