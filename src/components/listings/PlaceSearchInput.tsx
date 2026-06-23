import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, MapPin, Star, X } from 'lucide-react';
import { searchPlacesWithFallback } from '../../services/places.service';
import { isPlaceSearchEnabled } from '../../config/env';
import type { IPlaceResult } from '../../types/place.types';
import Spinner from '../ui/Spinner';

interface IPlaceSearchInputProps {
  onSelect: (place: IPlaceResult) => void;
  lat?: number;
  lng?: number;
}

const PlaceSearchInput: React.FC<IPlaceSearchInputProps> = ({
  onSelect,
  lat = -26.2,
  lng = 28.0,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IPlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const enabled = isPlaceSearchEnabled();

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const places = await searchPlacesWithFallback(searchQuery, lat, lng);
      setResults(places);
      setShowResults(true);
      setLoading(false);
    },
    [lat, lng],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => handleSearch(value), 400);
    },
    [handleSearch],
  );

  const handleSelect = useCallback(
    (place: IPlaceResult) => {
      onSelect(place);
      setQuery(place.name);
      setShowResults(false);
      setResults([]);
    },
    [onSelect],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if no API keys configured
  if (!enabled) return null;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nz-muted" size={16} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search for your venue..."
          className="w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl pl-11 pr-10 py-3 text-nz-text text-sm placeholder:text-nz-muted/60 outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-nz-muted hover:text-nz-text"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-nz-surface border border-nz-border rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {results.map((place) => (
            <button
              key={place.fsq_id ?? place.google_place_id}
              type="button"
              onClick={() => handleSelect(place)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-nz-elevated/50 transition-colors border-b border-nz-border/40 last:border-b-0"
            >
              {place.photo_url ? (
                <img
                  src={place.photo_url}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-nz-elevated flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-nz-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-nz-text font-medium text-sm truncate">{place.name}</p>
                <p className="text-nz-muted text-xs truncate">{place.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-nz-muted"
                    style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px' }}
                  >
                    {place.category}
                  </span>
                  {place.rating && (
                    <span className="flex items-center gap-0.5 text-nz-accent-text text-xs">
                      <Star size={10} fill="currentColor" />
                      {place.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full bg-nz-surface border border-nz-border rounded-xl shadow-xl px-4 py-6 text-center">
          <p className="text-nz-muted text-sm">No places found</p>
          <p className="text-nz-muted/70 text-xs mt-1">Enter details manually below</p>
        </div>
      )}
    </div>
  );
};

export default PlaceSearchInput;
