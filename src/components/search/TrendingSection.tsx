/**
 * Trending searches and neighbourhoods sections for Search page
 */
import React from 'react';
import { NEIGHBOURHOODS } from '../../constants/categories';
import Chip from '../ui/Chip';
import MonoLabel from '../ui/MonoLabel';

const TRENDING_TAGS = [
  'Amapiano',
  'Date night',
  'Soweto',
  'Rooftop',
  'Live jazz',
  'Sundowner',
  'Braai',
  'Free entry',
];

interface ITrendingSectionProps {
  onTagPress: (tag: string) => void;
}

const TrendingSection: React.FC<ITrendingSectionProps> = ({ onTagPress }) => (
  <>
    <section className="mb-6">
      <MonoLabel className="mb-2">TRENDING SEARCHES</MonoLabel>
      <div className="flex flex-wrap gap-2">
        {TRENDING_TAGS.map((tag) => (
          <Chip key={tag} onClick={() => onTagPress(tag)}>
            {tag}
          </Chip>
        ))}
      </div>
    </section>
    <section>
      <MonoLabel className="mb-2">NEIGHBOURHOODS</MonoLabel>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {NEIGHBOURHOODS.map((n) => (
          <button
            key={n}
            onClick={() => onTagPress(n)}
            className="bg-nz-surface border border-nz-border rounded-2xl px-4 py-3.5 text-left text-nz-text text-sm font-semibold hover:border-nz-muted/40 transition-all duration-200 active:scale-[0.98]"
            type="button"
          >
            {n}
          </button>
        ))}
      </div>
    </section>
  </>
);

export default TrendingSection;
