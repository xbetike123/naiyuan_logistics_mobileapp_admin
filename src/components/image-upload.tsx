// src/components/image-upload.tsx

'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Upload Image',
  accept = 'image/jpeg,image/png,image/webp',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate type
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) {
        setError('Only JPEG, PNG, WebP images allowed');
        return;
      }

      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File must be under 10MB');
        return;
      }

      setUploading(true);
      setError('');

      try {
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
        onChange(data.url);
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleRemove = () => {
    onChange('');
    setError('');
  };

  // Has image
  if (value) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <div className="relative group">
          <img
            src={value}
            alt="Uploaded"
            className="w-full max-h-48 rounded-xl border border-surface-200 object-contain bg-surface-50"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Upload zone
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-surface-700">
          {label}
        </label>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all
          ${
            dragOver
              ? 'border-brand-400 bg-brand-400/5'
              : 'border-surface-200 bg-surface-50 hover:border-surface-300 hover:bg-surface-100'
          }
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
                Click or drag to upload
              </p>
              <p className="text-xs text-surface-400 mt-0.5">
                JPEG, PNG, WebP · Max 10MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
