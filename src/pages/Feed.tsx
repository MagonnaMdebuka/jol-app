import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useListings } from '../contexts/ListingsContext';
import { useNearbyListings } from '../hooks/useNearbyListings';
import MapFilters from '../components/map/MapFilters';
import { FeaturedCard, TileCard, RowCard } from '../components/listings/ListingCard';
import Spinner from '../components/ui/Spinner';
import type { IListingWithDistance } from '../types/listing.types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const getDayLabel = (): string => {
  const d = new Date();
  return `${DAYS[d.getDay()].toUpperCase()} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

interface ISectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

const SectionHeader: React.FC<ISectionHeaderProps> = ({ title, onSeeAll }) => (
  <div className="flex items-center justify-between mb-4">
    <h2
      className="text-nz-text"
      style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontWeight: 800, fontSize: '22px' }}
    >
      {title}
    </h2>
    {onSeeAll && (
      <button onClick={onSeeAll} className="text-nz-accent text-[13px] font-semibold" type="button">
        See all
      </button>
    )}
  </div>
);

const Feed: React.FC = () => {
  const { filteredListings, loading, filters, userLat, userLng } = useListings();
  const nearbyListings = useNearbyListings(filteredListings, userLat, userLng, filters.radius);
  const navigate = useNavigate();

  const handleSearchPress = useCallback(() => navigate('/search'), [navigate]);

  const featured = nearbyListings.find((l) => l.type === 'event') ?? nearbyListings[0];
  const goOutListings = nearbyListings.filter((l) => l.type === 'event').slice(0, 12);
  const eatListings = nearbyListings.filter((l) => l.type === 'food').slice(0, 12);
  const allListings: IListingWithDistance[] = nearbyListings;

  return (
    <div className="h-full overflow-y-auto bg-nz-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        {/* Header */}
        <div className="pt-8 pb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span
                className="text-nz-muted block mb-2"
                style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.04em' }}
              >
                {getDayLabel()}
              </span>
              <h1
                className="leading-[0.88] tracking-[-0.04em]"
                style={{
                  fontFamily: '"Bricolage Grotesque", system-ui',
                  fontWeight: 900,
                  fontSize: 'clamp(36px, 5vw, 60px)',
                  color: '#f5ecd9',
                }}
              >
                Where to,{' '}
                <span style={{ color: '#ff7a3d' }}>tonight?</span>
              </h1>
              <p className="text-nz-muted text-sm mt-2">
                {loading ? 'Finding spots…' : `${nearbyListings.length} spots near you · Joburg`}
              </p>
            </div>
            <button
              onClick={handleSearchPress}
              className="mt-1 w-10 h-10 rounded-full bg-nz-elevated border border-nz-border flex items-center justify-center text-nz-muted hover:text-nz-text transition-colors shrink-0"
              aria-label="Search"
              type="button"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Vibe filter rail */}
          <MapFilters />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Spinner size="lg" />
            <p className="text-nz-muted text-sm">Loading nearby spots…</p>
          </div>
        ) : nearbyListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-nz-elevated border border-nz-border">
              <span className="text-2xl text-nz-muted/50">✦</span>
            </div>
            <div className="text-center">
              <p className="text-nz-text font-semibold text-base">No spots found</p>
              <p className="text-nz-muted text-sm mt-1">Try a different vibe or widen the search</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Featured */}
            {featured && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="text-nz-accent"
                    style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.04em' }}
                  >
                    ◈ FEATURED · TONIGHT
                  </span>
                </div>
                {/* Featured: two-column on large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FeaturedCard listing={featured} />
                  {nearbyListings[1] && <FeaturedCard listing={nearbyListings[1]} />}
                </div>
              </section>
            )}

            {/* Going out */}
            {goOutListings.length > 0 && (
              <section>
                <SectionHeader title="Going out" />
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {goOutListings.map((l) => (
                    <TileCard key={l.id} listing={l} />
                  ))}
                </div>
              </section>
            )}

            {/* Where to eat */}
            {eatListings.length > 0 && (
              <section>
                <SectionHeader title="Where to eat" />
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {eatListings.map((l) => (
                    <TileCard key={l.id} listing={l} />
                  ))}
                </div>
              </section>
            )}

            {/* Everything nearby — responsive grid */}
            {allListings.length > 0 && (
              <section>
                <SectionHeader title="Everything nearby" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {allListings.map((l) => (
                    <RowCard key={l.id} listing={l} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
