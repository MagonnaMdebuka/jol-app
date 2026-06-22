/**
 * Basic listing form fields: title, description, address
 */
import React from 'react';
import MonoLabel from '../ui/MonoLabel';
import Input from '../ui/Input';
import type { ListingType } from '../../types/listing.types';

interface IListingBasicFieldsProps {
  type: ListingType;
  title: string;
  description: string;
  address: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onTitleBlur?: () => void;
  onAddressBlur?: () => void;
  titleError?: string;
  addressError?: string;
  children?: React.ReactNode; // For venue selector slot
}

const ListingBasicFields: React.FC<IListingBasicFieldsProps> = ({
  type,
  title,
  description,
  address,
  onTitleChange,
  onDescriptionChange,
  onAddressChange,
  onTitleBlur,
  onAddressBlur,
  titleError,
  addressError,
  children,
}) => (
  <div className="flex flex-col gap-4">
    <MonoLabel className="mb-2">LISTING DETAILS</MonoLabel>

    {children}

    <Input
      label="Title *"
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      onBlur={onTitleBlur}
      placeholder={type === 'event' ? 'e.g. Amapiano Friday Night' : 'e.g. Marble Rosebank'}
      error={titleError}
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
        DESCRIPTION ({description.length}/300)
      </label>
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value.slice(0, 300))}
        rows={3}
        placeholder="Tell people what to expect…"
        className="w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm placeholder:text-nz-muted/60 outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40 resize-none"
      />
    </div>

    <Input
      label="Address *"
      value={address}
      onChange={(e) => onAddressChange(e.target.value)}
      onBlur={onAddressBlur}
      placeholder="Street, suburb, city"
      error={addressError}
    />
  </div>
);

export default ListingBasicFields;
