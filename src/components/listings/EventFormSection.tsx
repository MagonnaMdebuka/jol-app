/**
 * Event-specific form fields for NewListing and EditListing
 */
import React from 'react';
import { EVENT_TAGS } from '../../constants/categories';
import MonoLabel from '../ui/MonoLabel';
import Input from '../ui/Input';
import type { DressCode } from '../../types/listing.types';

const GENRE_VIBES = [
  'Amapiano',
  'House',
  'Hip Hop',
  'Afrobeats',
  'RnB',
  'Jazz',
  'Live Music',
  'Date night',
  'Late night',
  'Sundowner',
];

const DRESS_CHIP_OPTIONS = ['Casual', 'Smart Casual', 'Formal', 'Any'];

interface IEventFormSectionProps {
  eventDate: string;
  eventEndDate: string;
  entryFee: string;
  dressCode: DressCode;
  artist: string;
  ageRestriction: string;
  capacity: string;
  selectedTags: string[];
  onEventDateChange: (value: string) => void;
  onEventEndDateChange: (value: string) => void;
  onEntryFeeChange: (value: string) => void;
  onDressCodeChange: (value: DressCode) => void;
  onArtistChange: (value: string) => void;
  onAgeRestrictionChange: (value: string) => void;
  onCapacityChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
  // Validation
  eventDateError?: string;
  endDateError?: string;
  onEventDateBlur?: () => void;
  onEndDateBlur?: () => void;
}

const EventFormSection: React.FC<IEventFormSectionProps> = ({
  eventDate,
  eventEndDate,
  entryFee,
  dressCode,
  artist,
  ageRestriction,
  capacity,
  selectedTags,
  onEventDateChange,
  onEventEndDateChange,
  onEntryFeeChange,
  onDressCodeChange,
  onArtistChange,
  onAgeRestrictionChange,
  onCapacityChange,
  onToggleTag,
  eventDateError,
  endDateError,
  onEventDateBlur,
  onEndDateBlur,
}) => (
  <div className="flex flex-col gap-4 bg-nz-surface border border-nz-border/60 rounded-2xl p-4">
    <MonoLabel className="mb-2">EVENT DETAILS</MonoLabel>

    <div className="grid grid-cols-2 gap-3">
      <Input
        label="Date & Time"
        type="datetime-local"
        value={eventDate}
        onChange={(e) => onEventDateChange(e.target.value)}
        onBlur={onEventDateBlur}
        error={eventDateError}
      />
      <Input
        label="End Time"
        type="datetime-local"
        value={eventEndDate}
        onChange={(e) => onEventEndDateChange(e.target.value)}
        onBlur={onEndDateBlur}
        error={endDateError}
      />
    </div>

    <Input
      label="Entry Fee"
      value={entryFee}
      onChange={(e) => onEntryFeeChange(e.target.value)}
      placeholder="e.g. R100 at the door / Free"
      hint="Enter 'Free' for no cover charge"
    />

    <div>
      <MonoLabel className="mb-2">DRESS CODE</MonoLabel>
      <div className="flex flex-wrap gap-2">
        {DRESS_CHIP_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDressCodeChange(d as DressCode)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
              dressCode === d
                ? 'bg-nz-text text-nz-bg border-transparent'
                : 'border-nz-border text-nz-muted hover:text-nz-text'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>

    <Input
      label="Artist / DJ"
      value={artist}
      onChange={(e) => onArtistChange(e.target.value)}
      placeholder="Optional"
    />
    <Input
      label="Age Restriction"
      value={ageRestriction}
      onChange={(e) => onAgeRestrictionChange(e.target.value)}
      placeholder="e.g. 18+"
    />
    <Input
      label="Capacity"
      type="number"
      value={capacity}
      onChange={(e) => onCapacityChange(e.target.value)}
      placeholder="e.g. 200"
    />

    <div>
      <MonoLabel className="mb-2">GENRE / VIBE TAGS</MonoLabel>
      <div className="flex flex-wrap gap-2">
        {GENRE_VIBES.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
              selectedTags.includes(tag)
                ? 'bg-nz-accent text-white border-transparent'
                : 'border-nz-border text-nz-muted hover:text-nz-text'
            }`}
          >
            {tag}
          </button>
        ))}
        {EVENT_TAGS.filter((t) => !GENRE_VIBES.includes(t)).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
              selectedTags.includes(tag)
                ? 'bg-nz-accent text-white border-transparent'
                : 'border-nz-border text-nz-muted hover:text-nz-text'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default EventFormSection;
