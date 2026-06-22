/**
 * Venue dropdown selector for listing forms
 */
import React from 'react';
import type { IVenue } from '../../types/venue.types';

const SELECT_CLASS =
  'w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40';

interface IVenueSelectorProps {
  venues: IVenue[];
  venueId: string;
  onChange: (venueId: string) => void;
}

const VenueSelector: React.FC<IVenueSelectorProps> = ({ venues, venueId, onChange }) => {
  if (venues.length === 0) {
    return (
      <div className="bg-nz-elevated/60 border border-nz-border/40 rounded-xl px-4 py-3">
        <p className="text-nz-muted text-xs leading-relaxed">
          No venue registered. Set up your venue first to publish listings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-nz-muted"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          letterSpacing: '0.04em',
        }}
      >
        VENUE
      </label>
      <select value={venueId} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VenueSelector;
