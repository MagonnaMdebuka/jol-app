import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit2, Trash2, Eye, PlusCircle, Building2,
  CheckCircle, ChevronRight, Heart,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOwnerListings, softDeleteListing } from '../../services/listing.service';
import { getOwnerVenues } from '../../services/venue.service';
import { useToast } from '../../components/ui/Toast';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import type { IListing } from '../../types/listing.types';
import type { IVenue } from '../../types/venue.types';

const MonoLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    className="text-nz-muted"
    style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em', fontWeight: 500 }}
  >
    {children}
  </p>
);

const Dashboard: React.FC = () => {
  const { authUser } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<IListing[]>([]);
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [loading, setLoading] = useState(true);

  const ownerId = authUser?.id ?? 'owner-1';

  useEffect(() => {
    const load = async (): Promise<void> => {
      const [l, v] = await Promise.all([getOwnerListings(ownerId), getOwnerVenues(ownerId)]);
      setListings(l);
      setVenues(v);
      setLoading(false);
    };
    load();
  }, [ownerId]);

  const handleDelete = useCallback(
    async (id: string) => {
      await softDeleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast('Listing deactivated', 'info');
    },
    [toast],
  );

  const activeCount = listings.filter((l) => l.status === 'active').length;
  const totalViews = listings.reduce((sum, l) => sum + l.view_count, 0);
  const totalSaves = listings.reduce((sum, l) => sum + (l.save_count ?? 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner size="lg" />
        <p className="text-nz-muted text-sm">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting header */}
      <div>
        <MonoLabel>VENUE OWNER{venues[0] ? ` · ${venues[0].name.toUpperCase()}` : ''}</MonoLabel>
        <h1
          className="text-nz-text leading-[0.92] tracking-[-0.04em] mt-1"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 900,
            fontSize: '38px',
          }}
        >
          Howzit,{'\n'}owner.
        </h1>
      </div>

      {/* Stats 3-grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Views', value: totalViews, icon: <Eye size={16} />, accent: false },
          { label: 'Saves', value: totalSaves, icon: <Heart size={16} />, accent: false },
          { label: 'Active', value: activeCount, icon: <CheckCircle size={16} />, accent: true },
        ].map(({ label, value, icon, accent }) => (
          <div
            key={label}
            className={`rounded-2xl p-4 flex flex-col gap-2 ${
              accent
                ? 'border border-nz-accent/30'
                : 'bg-nz-surface border border-nz-border'
            }`}
            style={accent ? { background: 'rgba(255,122,61,0.12)' } : {}}
          >
            <span className={accent ? 'text-nz-accent' : 'text-nz-muted'}>{icon}</span>
            <div>
              <span
                className={`text-2xl font-black leading-none block ${
                  accent ? 'text-nz-accent-text' : 'text-nz-text'
                }`}
              >
                {value}
              </span>
              <MonoLabel>{label}</MonoLabel>
            </div>
          </div>
        ))}
      </div>

      {/* My Venues */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-nz-text"
            style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontWeight: 800, fontSize: '18px' }}
          >
            My Venues
          </h2>
          <Link
            to="/owner/venue/setup"
            className="flex items-center gap-1.5 text-xs text-nz-accent font-semibold hover:text-nz-accent-text transition-colors"
          >
            <Building2 size={13} />
            Add venue
          </Link>
        </div>

        {venues.length === 0 ? (
          <div className="bg-nz-surface border border-dashed border-nz-border/60 rounded-2xl p-8 flex flex-col items-center gap-4 text-nz-muted">
            <div className="p-4 rounded-2xl bg-nz-elevated border border-nz-border">
              <Building2 size={28} className="opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-nz-text/80 font-semibold text-sm">No venues yet</p>
              <p className="text-nz-muted text-xs mt-1">Set up a venue to start posting listings</p>
            </div>
            <Link to="/owner/venue/setup">
              <Button size="sm" variant="secondary">Set up a venue</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {venues.map((v) => (
              <div
                key={v.id}
                className="bg-nz-surface border border-nz-border/60 hover:border-nz-border rounded-2xl p-4 flex items-center gap-3 transition-all duration-200"
              >
                {v.cover_photo ? (
                  <img
                    src={v.cover_photo}
                    alt=""
                    className="h-[64px] w-[64px] rounded-[12px] object-cover shrink-0 border border-nz-border"
                  />
                ) : (
                  <div className="h-[64px] w-[64px] rounded-[12px] shrink-0 bg-nz-elevated border border-nz-border flex items-center justify-center">
                    <Building2 size={20} className="text-nz-muted opacity-60" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-nz-text font-semibold text-sm truncate">{v.name}</span>
                    {v.verified && <CheckCircle size={14} className="text-blue-400 shrink-0" />}
                  </div>
                  <span className="text-nz-muted text-xs">{v.type}</span>
                  {v.verified && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      <span
                        className="text-green-400"
                        style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '8px', letterSpacing: '0.04em' }}
                      >
                        LIVE
                      </span>
                    </div>
                  )}
                </div>
                <Badge variant={v.verified ? 'verified' : 'inactive'} gradient={false}>
                  {v.verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Listings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-nz-text"
            style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontWeight: 800, fontSize: '18px' }}
          >
            My Listings
          </h2>
          <Link to="/owner/listings/new">
            <Button size="sm" icon={<PlusCircle size={14} />}>New Listing</Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-nz-surface border border-dashed border-nz-border/60 rounded-2xl p-8 flex flex-col items-center gap-4 text-nz-muted">
            <div className="text-center">
              <p className="text-nz-text/80 font-semibold text-sm">No listings yet</p>
              <p className="text-nz-muted text-xs mt-1">Create your first listing to get discovered</p>
            </div>
            <Link to="/owner/listings/new">
              <Button size="sm" variant="secondary">Create first listing</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {listings.map((l) => (
              <div
                key={l.id}
                className="bg-nz-surface border border-nz-border/60 hover:border-nz-border rounded-2xl p-4 flex items-center gap-3 transition-all duration-200"
              >
                {l.images?.[0] ? (
                  <img
                    src={l.images[0]}
                    alt=""
                    className="h-[64px] w-[64px] rounded-[12px] object-cover shrink-0 border border-nz-border"
                  />
                ) : (
                  <div className="h-[64px] w-[64px] rounded-[12px] shrink-0 bg-nz-elevated border border-nz-border flex items-center justify-center">
                    <span className="text-nz-muted/40 text-xl">{l.type === 'event' ? '◈' : '⌇'}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={l.type} />
                    {l.status === 'active' && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        <span
                          className="text-green-400"
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '8px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          LIVE
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-nz-text font-semibold text-sm truncate mb-1">{l.title}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-nz-muted text-xs">
                      <Eye size={11} />
                      <span>{l.view_count}</span>
                    </div>
                    <div className="flex items-center gap-1 text-nz-muted text-xs">
                      <Heart size={11} />
                      <span>{l.save_count ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 items-center">
                  <Link
                    to={`/owner/listings/${l.id}/edit`}
                    className="p-2.5 rounded-xl text-nz-muted hover:text-nz-accent hover:bg-nz-accent/10 border border-transparent hover:border-nz-accent/20 transition-all duration-200"
                  >
                    <Edit2 size={15} />
                  </Link>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="p-2.5 rounded-xl text-nz-muted hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={16} className="text-nz-subtle" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tip card */}
      <div
        className="rounded-2xl px-4 py-4"
        style={{
          background: 'rgba(255,122,61,0.10)',
          border: '1px solid rgba(255,122,61,0.2)',
        }}
      >
        <p
          className="text-nz-accent mb-1"
          style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
        >
          PRO TIP
        </p>
        <p className="text-nz-text text-sm leading-relaxed">
          Listings with photos and clear entry fee info get <span className="text-nz-accent-text font-semibold">3x more views</span>. Add a cover photo to every listing.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
