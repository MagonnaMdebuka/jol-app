import React, { useState, useCallback, useMemo } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useListings } from '../contexts/ListingsContext';
import { NEIGHBOURHOODS } from '../constants/categories';
import { RowCard } from '../components/listings/ListingCard';
import Chip from '../components/ui/Chip';

const TRENDING_TAGS = [
  'Amapiano', 'Date night', 'Soweto', 'Rooftop',
  'Live jazz', 'Sundowner', 'Braai', 'Free entry',
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

const Search: React.FC = () => {
  const { listings } = useListings();
  const [query, setQuery] = useState('');

  const handleClear = useCallback(() => setQuery(''), []);
  const handleTagPress = useCallback((tag: string) => setQuery(tag), []);

  const results = useMemo(() => {
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

  const showResults = query.trim().length > 0;

  return (
    <div className="h-full overflow-y-auto bg-nz-bg">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Header */}
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

          {/* Search input */}
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
              {/* Trending searches */}
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

              {/* Neighbourhoods */}
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
              <p
                className="text-nz-muted mb-4"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  letterSpacing: '0.04em',
                }}
              >
                {results.length} RESULT{results.length !== 1 ? 'S' : ''}
              </p>
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <span className="text-3xl text-nz-muted/40">✦</span>
                  <p className="text-nz-text font-semibold">No results for "{query}"</p>
                  <p className="text-nz-muted text-sm">Try a venue name, neighbourhood, or vibe</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {results.map((l) => (
                    <RowCard key={l.id} listing={l} />
                  ))}
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
