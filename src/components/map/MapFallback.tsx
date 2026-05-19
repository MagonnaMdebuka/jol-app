import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { IListingWithDistance } from '../../types/listing.types';
import Badge from '../ui/Badge';

interface IMapFallbackProps {
  listings: IListingWithDistance[];
  onSelectListing: (listing: IListingWithDistance) => void;
}

const MapFallback: React.FC<IMapFallbackProps> = ({ listings, onSelectListing }) => (
  <div className="flex flex-col h-full bg-nz-bg overflow-hidden">
    {/* Notice banner */}
    <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 text-xs" style={{ background: 'rgba(255,122,61,0.08)', borderBottom: '1px solid rgba(255,122,61,0.2)', color: '#ffb88a' }}>
      <Navigation size={12} className="shrink-0" />
      <span>
        Add <code className="font-mono rounded px-1 py-0.5" style={{ background: 'rgba(255,122,61,0.15)', color: '#ff7a3d' }}>VITE_GOOGLE_MAPS_API_KEY</code> to .env for live maps
      </span>
    </div>

    {/* Map placeholder */}
    <div className="relative h-52 bg-nz-surface shrink-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(255,122,61,0.06) 0%, transparent 70%)' }} />

      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 400 208" preserveAspectRatio="none">
        {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="208" stroke="white" strokeWidth="1" />
        ))}
        {[0, 40, 80, 120, 160, 200].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="white" strokeWidth="1" />
        ))}
      </svg>

      <svg viewBox="0 0 400 208" className="w-full h-full" fill="none">
        <path d="M55 110 Q90 45 190 62 Q295 78 348 128 Q322 168 258 178 Q185 192 125 170 Q65 148 55 110Z" stroke="#ff7a3d" strokeWidth="1.5" fill="#ff7a3d" fillOpacity="0.06" />

        {listings.map((l) => {
          const x = ((l.location.lng - 27.5) / 1.5) * 350 + 25;
          const y = ((l.location.lat + 26.5) / 1.5) * 150 + 25;
          const cx = Math.max(20, Math.min(380, x));
          const cy = Math.max(20, Math.min(188, y));
          const colour = l.type === 'event' ? '#ff7a3d' : '#d9a85c';

          return (
            <g key={l.id} className="cursor-pointer" onClick={() => onSelectListing(l)}>
              <circle cx={cx} cy={cy} r="12" fill={colour} fillOpacity="0.15" />
              <circle cx={cx} cy={cy} r="6" fill={colour} fillOpacity="0.95" />
              <circle cx={cx - 2} cy={cy - 2} r="2" fill="white" fillOpacity="0.5" />
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
        <MapPin size={12} className="text-nz-muted" />
        <span className="text-nz-muted text-xs font-medium">Gauteng, South Africa</span>
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="w-2 h-2 rounded-full bg-nz-accent" />
          <span className="text-[10px] text-white/70">Events</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="w-2 h-2 rounded-full bg-nz-food" />
          <span className="text-[10px] text-white/70">Food</span>
        </div>
      </div>
    </div>

    {/* Listings list */}
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="px-5 py-3 flex items-center justify-between">
        <span
          className="text-nz-muted"
          style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.04em' }}
        >
          {listings.length} SPOTS NEARBY
        </span>
      </div>

      <div className="flex flex-col px-3 gap-1.5">
        {listings.map((l) => (
          <button
            key={l.id}
            onClick={() => onSelectListing(l)}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-nz-surface hover:bg-nz-elevated border border-nz-border/60 hover:border-nz-border rounded-2xl text-left transition-all duration-200 active:scale-[0.99]"
            type="button"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: l.type === 'event' ? 'rgba(255,122,61,0.12)' : 'rgba(217,168,92,0.12)' }}>
              <MapPin size={16} className={l.type === 'event' ? 'text-nz-accent' : 'text-nz-food'} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-nz-text text-sm font-semibold truncate leading-tight mb-0.5">{l.title}</p>
              <p className="text-nz-muted text-xs truncate">{l.address}</p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant={l.type} gradient={false} />
              <span className="text-[10px] text-nz-muted font-medium">
                {(l.distance_metres / 1000).toFixed(1)} km
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default MapFallback;
