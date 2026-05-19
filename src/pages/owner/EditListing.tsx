import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListing, updateListing } from '../../services/listing.service';
import { useToast } from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { IListingWithDistance, DressCode, PriceRange } from '../../types/listing.types';

const SELECT_CLASS =
  'w-full bg-nz-elevated border border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm outline-none focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40 transition-all duration-200';

const EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<IListingWithDistance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [dressCode, setDressCode] = useState<DressCode>('Smart Casual');
  const [openingHours, setOpeningHours] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>('RR');
  const [special, setSpecial] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async (): Promise<void> => {
      const data = await getListing(id);
      if (data) {
        setListing(data);
        setTitle(data.title);
        setDescription(data.description ?? '');
        setEntryFee(data.entry_fee ?? '');
        setDressCode((data.dress_code as DressCode) ?? 'Smart Casual');
        setOpeningHours(data.opening_hours ?? '');
        setPriceRange((data.price_range as PriceRange) ?? 'RR');
        setSpecial(data.special ?? '');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = useCallback(async () => {
    if (!id || !listing) return;
    setSaving(true);
    const patch =
      listing.type === 'event'
        ? {
            title,
            description: description || null,
            entry_fee: entryFee || null,
            dress_code: dressCode,
          }
        : {
            title,
            description: description || null,
            opening_hours: openingHours || null,
            price_range: priceRange,
            special: special || null,
          };

    const { error } = await updateListing(id, patch);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Listing updated', 'success');
      navigate('/owner/dashboard');
    }
    setSaving(false);
  }, [
    id, listing, title, description, entryFee, dressCode,
    openingHours, priceRange, special, toast, navigate,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!listing) {
    return <p className="text-nz-muted text-center py-20">Listing not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <h1
        className="text-nz-text tracking-[-0.03em]"
        style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontWeight: 900, fontSize: '28px' }}
      >
        Edit Listing
      </h1>

      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="flex flex-col gap-1.5">
        <label
          className="text-nz-muted"
          style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
        >
          DESCRIPTION ({description.length}/300)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 300))}
          rows={3}
          className="w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm placeholder:text-nz-muted/60 outline-none focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40 resize-none transition-all duration-200"
        />
      </div>

      {listing.type === 'event' && (
        <>
          <Input label="Entry Fee" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label
              className="text-nz-muted"
              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
            >
              DRESS CODE
            </label>
            <select
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value as DressCode)}
              className={SELECT_CLASS}
            >
              {['Casual', 'Smart Casual', 'Formal', 'Any'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {listing.type === 'food' && (
        <>
          <Input label="Opening Hours" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label
              className="text-nz-muted"
              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
            >
              PRICE RANGE
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as PriceRange)}
              className={SELECT_CLASS}
            >
              {['R', 'RR', 'RRR', 'RRRR'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <Input label="Special / Deal" value={special} onChange={(e) => setSpecial(e.target.value)} />
        </>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/owner/dashboard')} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} className="flex-1">
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default EditListing;
