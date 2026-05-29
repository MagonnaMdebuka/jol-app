import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search as SearchIcon, X, MapPin, ExternalLink } from 'lucide-react';
import { useListings } from '../contexts/ListingsContext';
import { NEIGHBOURHOODS } from '../constants/categories';
import { RowCard } from '../components/listings/ListingCard';
import Chip from '../components/ui/Chip';
import BottomSheet from '../components/ui/BottomSheet';
import Badge from '../components/ui/Badge';
import OsmCard from '../components/search/OsmCard';
import {
  searchOsmPlaces,
  isEventQuery,
  formatOsmCategory,
  geocodePlace,
  overpassAreaSearch,
} from '../services/osm.service';
import type { IOsmPlace } from '../services/osm.service';

const TRENDING_TAGS = [
  'Amapiano',
  'Date night',
  'Soweto',
  'Rooftop',
  'Live jazz',
  'Sundowner',
  'Braai',
  'Free entry',
];

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

const fmtDistance = (m: number): string =>
  m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)} km`;

const buildRegisterUrl = (place: IOsmPlace): string => {
  const params = new URLSearchParams({ name: place.name, address: place.address });
  return `/owner/register?${params.toString()}`;
};

const OsmPlaceDetail: React.FC<{ place: IOsmPlace }> = ({ place }) => (
  <div className="pt-2">
    <div className="flex items-start gap-3 mb-4">
      <MapPin size={22} className="text-nz-muted shrink-0 mt-1" />
      <div>
        <h2
          className="text-nz-text leading-tight"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 900,
            fontSize: '22px',
          }}
        >
          {place.name}
        </h2>
        <p
          className="text-nz-muted mt-0.5"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            letterSpacing: '0.04em',
          }}
        >
          {formatOsmCategory(place.amenity, place.cuisine)}
        </p>
      </div>
    </div>

    <p className="text-nz-muted text-sm mb-1">{place.address}</p>
    {place.suburb && <p className="text-nz-muted text-sm mb-1">{place.suburb}</p>}
    {place.distance_metres !== null && (
      <p className="text-nz-muted text-sm mb-3">{fmtDistance(place.distance_metres)} away</p>
    )}

    <Badge variant="neutral">Not on Jol</Badge>

    <div className="border-t border-nz-border my-4" />

    <a
      href={buildRegisterUrl(place)}
      className="flex items-center justify-between gap-3 bg-nz-elevated border border-nz-accent/30 rounded-2xl p-4 hover:border-nz-accent/60 transition-colors"
    >
      <div>
        <p className="text-nz-accent font-semibold text-sm">Add this venue to Jol</p>
        <p className="text-nz-muted text-xs mt-0.5">List events and reach more people</p>
      </div>
      <ExternalLink size={18} className="shrink-0 text-nz-accent" />
    </a>

    <p
      className="text-nz-muted/40 text-center mt-4"
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        letterSpacing: '0.04em',
      }}
    >
      DATA © OPENSTREETMAP CONTRIBUTORS
    </p>
  </div>
);

const OsmLoadingState: React.FC = () => (
  <div className="flex items-center gap-2 py-4 text-nz-muted">
    <div className="w-3 h-3 rounded-full border-2 border-nz-muted/30 border-t-nz-muted animate-spin" />
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        letterSpacing: '0.04em',
      }}
    >
      SEARCHING NEARBY PLACES…
    </span>
  </div>
);

const INITIAL_LIMIT = 20;
const LOAD_MORE_LIMIT = 50;

const Search: React.FC = () => {
  const { filteredListings: listings, userLat, userLng } = useListings();
  const [query, setQuery] = useState('');
  const [osmResults, setOsmResults] = useState<IOsmPlace[]>([]);
  const [osmLoading, setOsmLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [selectedOsmPlace, setSelectedOsmPlace] = useState<IOsmPlace | null>(null);
  const [areaCoords, setAreaCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLimit, setCurrentLimit] = useState(INITIAL_LIMIT);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: userLat,
    lng: userLng,
  });

  // Keep ref in sync without triggering the search effect
  useEffect(() => {
    locationRef.current = { lat: userLat, lng: userLng };
  }, [userLat, userLng]);

  const handleClear = useCallback(() => {
    setQuery('');
    setAreaCoords(null);
    setCurrentLimit(INITIAL_LIMIT);
  }, []);
  const handleTagPress = useCallback((tag: string) => setQuery(tag), []);

  const jolResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.venue_name?.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.tags?.some((t) => t.toLowerCase().includes(q)) ||
        l.vibe?.some((v) => v.toLowerCase().includes(q)),
    );
  }, [listings, query]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const skip = !query.trim() || isEventQuery(query);
    debounceRef.current = setTimeout(
      () => {
        if (skip) {
          setOsmResults([]);
          setOsmLoading(false);
          setAreaCoords(null);
          setCurrentLimit(INITIAL_LIMIT);
        } else {
          setOsmLoading(true);
          setAreaCoords(null);
          setCurrentLimit(INITIAL_LIMIT);
          const { lat, lng } = locationRef.current;

          // First try normal search
          searchOsmPlaces(query, lat, lng)
            .then(async (places) => {
              if (places.length > 0) {
                setOsmResults(places);
                return;
              }
              // If no results, try geocoding for area search
              const coord = await geocodePlace(query);
              if (coord) {
                setAreaCoords(coord);
                const hasLoc = lat !== null && lng !== null;
                const refLat = lat ?? coord.lat;
                const refLng = lng ?? coord.lng;
                const areaPlaces = await overpassAreaSearch(
                  coord.lat,
                  coord.lng,
                  refLat,
                  refLng,
                  hasLoc,
                  INITIAL_LIMIT,
                );
                setOsmResults(
                  areaPlaces.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0)),
                );
              } else {
                setOsmResults([]);
              }
            })
            .catch(() => setOsmResults([]))
            .finally(() => setOsmLoading(false));
        }
      },
      skip ? 0 : 400,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleLoadMore = useCallback(async () => {
    if (!areaCoords || loadMoreLoading) return;

    setLoadMoreLoading(true);
    const newLimit = currentLimit + LOAD_MORE_LIMIT;
    const { lat, lng } = locationRef.current;
    const hasLoc = lat !== null && lng !== null;
    const refLat = lat ?? areaCoords.lat;
    const refLng = lng ?? areaCoords.lng;

    try {
      const places = await overpassAreaSearch(
        areaCoords.lat,
        areaCoords.lng,
        refLat,
        refLng,
        hasLoc,
        newLimit,
      );
      setOsmResults(places.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0)));
      setCurrentLimit(newLimit);
    } finally {
      setLoadMoreLoading(false);
    }
  }, [areaCoords, loadMoreLoading, currentLimit]);

  const canLoadMore = areaCoords !== null && osmResults.length >= currentLimit;
  const showResults = query.trim().length > 0;

  return (
    <div className="h-full overflow-y-auto bg-nz-bg">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="pt-8 pb-5">
          <h1
            className="text-nz-text tracking-[-0.04em] mb-4"
            style={{
              fontFamily: '"Bricolage Grotesque", system-ui',
              fontWeight: 900,
              fontSize: '36px',
            }}
          >
            Search
          </h1>
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nz-muted pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Venues, events, neighbourhoods…"
              className="w-full bg-nz-elevated border border-nz-border rounded-2xl pl-10 pr-10 py-3.5 text-nz-text text-sm placeholder:text-nz-muted/60 outline-none focus:border-nz-accent/40 focus:ring-2 focus:ring-nz-accent/30 transition-all duration-200"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nz-muted hover:text-nz-text"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="pb-24">
          {!showResults ? (
            <>
              <section className="mb-6">
                <MonoLabel>TRENDING SEARCHES</MonoLabel>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.map((tag) => (
                    <Chip key={tag} onClick={() => handleTagPress(tag)}>
                      {tag}
                    </Chip>
                  ))}
                </div>
              </section>
              <section>
                <MonoLabel>NEIGHBOURHOODS</MonoLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {NEIGHBOURHOODS.map((n) => (
                    <button
                      key={n}
                      onClick={() => handleTagPress(n)}
                      className="bg-nz-surface border border-nz-border rounded-2xl px-4 py-3.5 text-left text-nz-text text-sm font-semibold hover:border-nz-muted/40 transition-all duration-200 active:scale-[0.98]"
                      type="button"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              {jolResults.length > 0 && (
                <section className="mb-6">
                  <MonoLabel>
                    ON JOL — {jolResults.length} RESULT{jolResults.length !== 1 ? 'S' : ''}
                  </MonoLabel>
                  <div className="flex flex-col gap-2.5">
                    {jolResults.map((l) => (
                      <RowCard key={l.id} listing={l} />
                    ))}
                  </div>
                </section>
              )}

              {!isEventQuery(query) && (
                <section>
                  {osmLoading ? (
                    <OsmLoadingState />
                  ) : osmResults.length > 0 ? (
                    <>
                      <MonoLabel>NEARBY PLACES — {osmResults.length} FROM OPENSTREETMAP</MonoLabel>
                      <div className="flex flex-col gap-2.5">
                        {osmResults.map((p) => (
                          <OsmCard
                            key={`${p.osm_type}-${p.osm_id}`}
                            place={p}
                            onClick={setSelectedOsmPlace}
                          />
                        ))}
                      </div>
                      {canLoadMore && (
                        <button
                          onClick={handleLoadMore}
                          disabled={loadMoreLoading}
                          className="w-full mt-4 py-3 border border-nz-border rounded-2xl text-sm text-nz-muted font-medium hover:text-nz-text hover:border-nz-muted/40 transition-all duration-200 disabled:opacity-50"
                          type="button"
                        >
                          {loadMoreLoading ? 'Loading…' : 'Load more places'}
                        </button>
                      )}
                    </>
                  ) : null}
                </section>
              )}

              {jolResults.length === 0 && osmResults.length === 0 && !osmLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <span className="text-3xl text-nz-muted/40">✦</span>
                  <p className="text-nz-text font-semibold">No results for &quot;{query}&quot;</p>
                  <p className="text-nz-muted text-sm">Try a venue name, neighbourhood, or vibe</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BottomSheet open={selectedOsmPlace !== null} onClose={() => setSelectedOsmPlace(null)}>
        {selectedOsmPlace && <OsmPlaceDetail place={selectedOsmPlace} />}
      </BottomSheet>
    </div>
  );
};

export default Search;
