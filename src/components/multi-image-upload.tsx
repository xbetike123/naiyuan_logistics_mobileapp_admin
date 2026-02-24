// src/components/multi-image-upload.tsx

'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Plus } from 'lucide-react';
import { api } from '@/lib/api';

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  max?: number;
}

export function MultiImageUpload({
  values,
  onChange,
  label = 'Package Photos',
  max = 10,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      // Check max
      if (values.length + fileArray.length > max) {
        setError(`Maximum ${max} photos allowed`);
        return;
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      for (const file of fileArray) {
        if (!allowed.includes(file.type)) {
          setError('Only JPEG, PNG, WebP images allowed');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Each file must be under 10MB');
          return;
        }
      }

      setUploading(true);
      setError('');

      try {
        const newUrls: string[] = [];

        for (const file of fileArray) {
          const formData = new FormData();
          formData.append('file', file);

          const token = api.getToken();
          const res = await fetch('/api/upload/image', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || 'Upload failed');
          }

          const data = await res.json();
          newUrls.push(data.url);
        }

        onChange([...values, ...newUrls]);
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [values, onChange, max],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) handleUpload(files);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) handleUpload(files);
  };

  const handleRemove = (index: number) => {
    const updated = values.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-surface-700">
          <span className="flex items-center gap-1.5">
            {label}
            <span className="text-xs text-surface-400 font-normal">
              ({values.length}/{max})
            </span>
          </span>
        </label>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {values.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group aspect-square">
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full rounded-xl border border-surface-200 object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Add more button (inline) */}
          {values.length < max && !uploading && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-surface-200 bg-surface-50 hover:border-surface-300 hover:bg-surface-100 flex items-center justify-center transition-all"
            >
              <Plus size={20} className="text-surface-400" />
            </button>
          )}
        </div>
      )}

      {/* Upload zone (when empty or uploading) */}
      {values.length === 0 && (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`
            flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${dragOver ? 'border-brand-400 bg-brand-400/5' : 'border-surface-200 bg-surface-50 hover:border-surface-300 hover:bg-surface-100'}
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="text-brand-500 animate-spin" />
              <p className="text-sm text-surface-500">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center">
                <Upload size={18} className="text-surface-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-surface-700">
                  Click or drag to upload photos
                </p>
                <p className="text-xs text-surface-400 mt-0.5">
                  JPEG, PNG, WebP · Max 10MB each · Up to {max} photos
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Uploading indicator (when adding more) */}
      {uploading && values.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <Loader2 size={14} className="animate-spin" />
          Uploading...
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
