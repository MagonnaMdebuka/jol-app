import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { useSaved } from '../contexts/SavedContext';
import { useListings } from '../contexts/ListingsContext';
import { RowCard } from '../components/listings/ListingCard';

const Saved: React.FC = () => {
  const { savedIds } = useSaved();
  const { listings } = useListings();

  const savedListings = useMemo(
    () => listings.filter((l) => savedIds.has(l.id)),
    [listings, savedIds],
  );

  return (
    <div className="h-full overflow-y-auto bg-nz-bg">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="pt-8 pb-5">
          <p
            className="text-nz-muted mb-1"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '9px',
              letterSpacing: '0.04em',
              fontWeight: 500,
            }}
          >
            YOUR PLANS
          </p>
          <h1
            className="text-nz-text tracking-[-0.04em] leading-[0.88]"
            style={{
              fontFamily: '"Bricolage Grotesque", system-ui',
              fontWeight: 900,
              fontSize: '42px',
            }}
          >
            Saved.
          </h1>
          {savedListings.length > 0 && (
            <p className="text-nz-muted text-sm mt-1">
              {savedListings.length} spot{savedListings.length !== 1 ? 's' : ''} saved
            </p>
          )}
        </div>

        <div className="pb-24">
          {savedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-nz-elevated border border-nz-border flex items-center justify-center">
                <Heart size={24} className="text-nz-muted/50" />
              </div>
              <div>
                <p className="text-nz-text font-semibold text-base">Nothing saved yet.</p>
                <p className="text-nz-muted text-sm mt-1">
                  Tap the heart on any listing to save it here
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {savedListings.map((l) => (
                <RowCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Saved;
