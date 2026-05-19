import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadImage, generatePath } from '../../services/storage.service';

interface IImageUploaderProps {
  bucket: 'venue-photos' | 'listing-images';
  ownerId: string;
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
}

const ImageUploader: React.FC<IImageUploaderProps> = ({
  bucket,
  ownerId,
  onUpload,
  maxFiles = 5,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      const newPreviews: string[] = [];
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, maxFiles - previews.length)) {
        const preview = URL.createObjectURL(file);
        newPreviews.push(preview);
        const url = await uploadImage(file, bucket, generatePath(ownerId, file.name));
        urls.push(url);
      }
      setPreviews((prev) => [...prev, ...newPreviews]);
      onUpload(urls);
      setUploading(false);
    },
    [bucket, ownerId, onUpload, maxFiles, previews.length],
  );

  const removePreview = useCallback((index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <span
        className="text-nz-muted"
        style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
      >
        PHOTOS ({previews.length}/{maxFiles})
      </span>
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={i} className="relative h-20 w-20 rounded-[12px] overflow-hidden border border-nz-border">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => removePreview(i)}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
              type="button"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {previews.length < maxFiles && (
          <label className="h-20 w-20 flex flex-col items-center justify-center rounded-[12px] border border-dashed border-nz-border bg-nz-elevated cursor-pointer hover:border-nz-accent/50 hover:bg-nz-accent/5 transition-all duration-200">
            <Upload size={20} className="text-nz-muted" />
            <span className="text-xs text-nz-muted mt-1">{uploading ? '…' : 'Add'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
