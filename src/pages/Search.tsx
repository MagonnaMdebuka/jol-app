import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useListings } from '../contexts/ListingsContext';
import { NEIGHBOURHOOD_AREAS } from '../constants/categories';
import { searchListings } from '../services/search.service';
import { haversine } from '../utils/geo';
import TrendingSection from '../components/search/TrendingSection';
import { RowCard } from '../components/listings/ListingCard';
import { RowCardSkeleton } from '../components/ui/Skeleton';
import MonoLabel from '../components/ui/MonoLabel';
import type { IListingWithDistance } from '../types/listing.types';

const normalize = (value: string): string => value.trim().toLowerCase();

const Search: React.FC = () => {
  const { filteredListings: listings, userLat, userLng, addEphemeralListings } = useListings();
  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState<IListingWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: userLat,
    lng: userLng,
  });

  useEffect(() => {
    locationRef.current = { lat: userLat, lng: userLng };
  }, [userLat, userLng]);

  const knownArea = useMemo(() => {
    const q = normalize(query);
    if (!q) return null;
    return NEIGHBOURHOOD_AREAS.find((area) => normalize(area.name) === q) ?? null;
  }, [query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setDbResults([]);
  }, []);

  const handleTagPress = useCallback((tag: string) => setQuery(tag), []);

  // Local filter for in-memory listings (instant results)
  const localResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    if (knownArea) {
      return listings
        .map((l) => ({
          listing: l,
          distance: haversine(knownArea.lat, knownArea.lng, l.location.lat, l.location.lng),
        }))
        .filter(({ distance }) => distance <= knownArea.radiusMetres)
        .sort((a, b) => a.distance - b.distance)
        .map(({ listing }) => listing);
    }

    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.venue_name?.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.cuisine_type?.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.tags?.some((t) => t.toLowerCase().includes(q)) ||
        l.vibe?.some((v) => v.toLowerCase().includes(q)),
    );
  }, [knownArea, listings, query]);

  // Debounced database search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) {
      setDbResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      const { lat, lng } = locationRef.current;
      const searchLat = lat ?? -26.0;
      const searchLng = lng ?? 28.0;

      const results = await searchListings(trimmed, searchLat, searchLng, 30000, 50);
      setDbResults(results);
      // Store OSM/Google results in context so ListingDetail can find them
      const ephemeral = results.filter((r) => r.id.startsWith('osm-') || r.id.startsWith('place-'));
      if (ephemeral.length > 0) {
        addEphemeralListings(ephemeral);
      }
      setLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, addEphemeralListings]);

  // Merge local and DB results, dedupe by ID
  const allResults = useMemo(() => {
    const seen = new Set<string>();
    const merged: IListingWithDistance[] = [];

    // Local results first (from context)
    for (const l of localResults) {
      if (!seen.has(l.id)) {
        seen.add(l.id);
        merged.push(l);
      }
    }

    // Then DB results
    for (const l of dbResults) {
      if (!seen.has(l.id)) {
        seen.add(l.id);
        merged.push(l);
      }
    }

    return merged;
  }, [localResults, dbResults]);

  const showResults = query.trim().length >= 3;

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
            <TrendingSection onTagPress={handleTagPress} />
          ) : (
            <>
              {loading && (
                <div className="space-y-3">
                  <MonoLabel>SEARCHING…</MonoLabel>
                  <RowCardSkeleton />
                  <RowCardSkeleton />
                  <RowCardSkeleton />
                </div>
              )}

              {!loading && allResults.length > 0 && (
                <section>
                  <MonoLabel className="mb-2">
                    {allResults.length} RESULT{allResults.length !== 1 ? 'S' : ''}
                  </MonoLabel>
                  <div className="flex flex-col gap-2.5">
                    {allResults.map((l) => (
                      <RowCard key={l.id} listing={l} />
                    ))}
                  </div>
                </section>
              )}

              {!loading && allResults.length === 0 && (
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
    </div>
  );
};

export default Search;
