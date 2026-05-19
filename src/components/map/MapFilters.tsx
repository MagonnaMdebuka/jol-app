import React, { useCallback } from 'react';
import { useListings } from '../../contexts/ListingsContext';
import { VIBE_FILTERS } from '../../constants/categories';
import type { VibeFilterId } from '../../constants/categories';
import Chip from '../ui/Chip';

const MapFilters: React.FC = () => {
  const { filters, setFilters } = useListings();

  const setVibe = useCallback(
    (vibe: VibeFilterId) => setFilters({ vibe }),
    [setFilters],
  );

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 pointer-events-auto">
      {VIBE_FILTERS.map((f) => (
        <Chip
          key={f.id}
          icon={f.icon}
          active={filters.vibe === f.id}
          onClick={() => setVibe(f.id as VibeFilterId)}
        >
          {f.label}
        </Chip>
      ))}
    </div>
  );
};

export default MapFilters;
