/**
 * Type toggle for selecting between event and food listing types
 */
import React from 'react';
import { Calendar, UtensilsCrossed } from 'lucide-react';
import type { ListingType } from '../../types/listing.types';

interface IListingTypeToggleProps {
  type: ListingType;
  onChange: (type: ListingType) => void;
}

const ListingTypeToggle: React.FC<IListingTypeToggleProps> = ({ type, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    {[
      {
        value: 'event' as const,
        icon: <Calendar size={20} />,
        title: 'Event',
        sub: 'Party, DJ night, live music',
      },
      {
        value: 'food' as const,
        icon: <UtensilsCrossed size={20} />,
        title: 'Food Spot',
        sub: 'Restaurant, market, cafe',
      },
    ].map(({ value, icon, title, sub }) => (
      <button
        key={value}
        type="button"
        onClick={() => onChange(value)}
        className={`flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
          type === value
            ? 'bg-nz-accent/10 border-nz-accent/50'
            : 'bg-nz-surface border-nz-border hover:border-nz-muted/40'
        }`}
      >
        <span className={type === value ? 'text-nz-accent' : 'text-nz-muted'}>{icon}</span>
        <div>
          <p className={`font-bold text-sm ${type === value ? 'text-nz-text' : 'text-nz-muted'}`}>
            {title}
          </p>
          <p className="text-nz-subtle text-xs mt-0.5">{sub}</p>
        </div>
      </button>
    ))}
  </div>
);

export default ListingTypeToggle;
