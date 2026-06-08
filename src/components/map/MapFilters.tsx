import React, { useCallback } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useListings, type SortBy } from '../../contexts/ListingsContext';
import { VIBE_FILTERS } from '../../constants/categories';
import type { VibeFilterId } from '../../constants/categories';
import Chip from '../ui/Chip';

const MapFilters: React.FC = () => {
  const { filters, setFilters } = useListings();

  const setVibe = useCallback((vibe: VibeFilterId) => setFilters({ vibe }), [setFilters]);

  const toggleSort = useCallback(() => {
    const next: SortBy = filters.sortBy === 'nearest' ? 'latest' : 'nearest';
    setFilters({ sortBy: next });
  }, [filters.sortBy, setFilters]);

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
      <button
        onClick={toggleSort}
        type="button"
        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold border whitespace-nowrap cursor-pointer transition-all duration-150 active:scale-[0.96] bg-nz-surface text-nz-muted border-nz-border hover:text-nz-text"
      >
        <ArrowUpDown size={12} />
        {filters.sortBy === 'nearest' ? 'Nearest' : 'Latest'}
      </button>
    </div>
  );
};

export default MapFilters;
