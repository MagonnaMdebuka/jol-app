/**
 * Food-specific form fields for NewListing and EditListing
 */
import React from 'react';
import { CUISINE_TYPES, PRICE_RANGES } from '../../constants/categories';
import MonoLabel from '../ui/MonoLabel';
import Input from '../ui/Input';
import type { PriceRange } from '../../types/listing.types';

const SELECT_CLASS =
  'w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40';

interface IFoodFormSectionProps {
  cuisineType: string;
  openingHours: string;
  priceRange: PriceRange;
  special: string;
  onCuisineTypeChange: (value: string) => void;
  onOpeningHoursChange: (value: string) => void;
  onPriceRangeChange: (value: PriceRange) => void;
  onSpecialChange: (value: string) => void;
}

const FoodFormSection: React.FC<IFoodFormSectionProps> = ({
  cuisineType,
  openingHours,
  priceRange,
  special,
  onCuisineTypeChange,
  onOpeningHoursChange,
  onPriceRangeChange,
  onSpecialChange,
}) => (
  <div className="flex flex-col gap-4 bg-nz-surface border border-nz-border/60 rounded-2xl p-4">
    <MonoLabel className="mb-2">FOOD DETAILS</MonoLabel>

    <div className="flex flex-col gap-1.5">
      <label
        className="text-nz-muted"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          letterSpacing: '0.04em',
        }}
      >
        CUISINE TYPE
      </label>
      <select
        value={cuisineType}
        onChange={(e) => onCuisineTypeChange(e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">Select cuisine…</option>
        {CUISINE_TYPES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>

    <Input
      label="Opening Hours"
      value={openingHours}
      onChange={(e) => onOpeningHoursChange(e.target.value)}
      placeholder="e.g. Mon–Sun 10:00–22:00"
    />

    <div className="flex flex-col gap-1.5">
      <label
        className="text-nz-muted"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          letterSpacing: '0.04em',
        }}
      >
        PRICE RANGE
      </label>
      <select
        value={priceRange}
        onChange={(e) => onPriceRangeChange(e.target.value as PriceRange)}
        className={SELECT_CLASS}
      >
        {PRICE_RANGES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>

    <Input
      label="Special / Deal"
      value={special}
      onChange={(e) => onSpecialChange(e.target.value)}
      placeholder="e.g. R75 lunch special weekdays"
    />
  </div>
);

export default FoodFormSection;
