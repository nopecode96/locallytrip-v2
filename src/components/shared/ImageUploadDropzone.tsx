'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { compressImage } from '@/lib/utils/image-compression';

export interface ImageUploadDropzoneProps {
  folder?: string;
  value?: string | string[];
  onChange: (value: any) => void;
  onPreviewChange?: (previewUrl: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  onUploadSuccess?: (result: { url: string; fileName: string; cleanFileName: string }) => void;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  hidePreview?: boolean;
}

export function ImageUploadDropzone({
  folder = 'avatars',
  value,
  onChange,
  onPreviewChange,
  onUploadingChange,
  onUploadSuccess,
  multiple = false,
  maxFiles = 5,
  label,
  description,
  className = '',
  disabled = false,
  hidePreview = false,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);

  // Normalisasi value ke bentuk array untuk rendering thumbnail jika multiple
  const currentUrls: string[] = Array.isArray(value)
    ? value.filter(Boolean)
    : value
    ? [value]
    : [];

  const displayUrls = isUploading && localPreviews.length > 0 ? localPreviews : currentUrls;

  // Handler proses upload single file dengan instant local preview & kompresi client-side
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar valid (JPG, PNG, WebP)');
      return;
    }

    // 1. Instant preview visual lokal (Blob URL)
    const blobUrl = URL.createObjectURL(file);
    if (onPreviewChange) onPreviewChange(blobUrl);
    setLocalPreviews([blobUrl]);

    setIsUploading(true);
    if (onUploadingChange) onUploadingChange(true);

    try {
      // 2. Kompresi otomatis sebelum dikirim (maks 800x800 avatar, 1200x800 experiences/meetups/forums, 1600x1200 lainnya)
      const isAvatar = folder === 'avatars';
      const isLandscapeCard = folder === 'meetups' || folder === 'forums' || folder === 'experiences';
      const maxW = isAvatar ? 800 : isLandscapeCard ? 1200 : 1600;
      const maxH = isAvatar ? 800 : isLandscapeCard ? 800 : 1200;
      const compressedFile = await compressImage(
        file,
        maxW,
        maxH,
        0.82
      );

      // 3. Kirim file terkompresi ke endpoint upload
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folder', folder || 'avatars');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Cegah 'Unexpected token <' jika server mengembalikan HTML (misal 413 Payload Too Large)
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await res.text();
        console.error('Server non-JSON response:', errorText);
        throw new Error(`Server error (${res.status}). Payload mungkin terlalu besar atau route bermasalah.`);
      }

      const data = await res.json();
      console.log('Upload response:', data);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload gagal');
      }

      const savedUrl = data.url || (Array.isArray(data.urls) && data.urls[0]);
      const savedFileName = data.cleanFileName || data.fileName || (Array.isArray(data.fileNames) && data.fileNames[0]) || '';
      console.log('Dropzone upload success, calling onChange with:', savedUrl, 'and cleanFileName:', savedFileName);

      if (onUploadSuccess && savedUrl) {
        onUploadSuccess({
          url: savedUrl,
          fileName: savedFileName,
          cleanFileName: savedFileName,
        });
      }

      if (savedUrl) {
        onChange(savedUrl); // WAJIB: kirimkan string ke parent
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err?.message || 'Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
      if (onUploadingChange) onUploadingChange(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handler proses upload multiple files
  const handleUploadFiles = async (filesToUpload: File[]) => {
    if (disabled || filesToUpload.length === 0) return;

    if (!multiple) {
      processFile(filesToUpload[0]);
      return;
    }

    setErrorMessage(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
    const invalidFiles = filesToUpload.filter((f) => !validTypes.includes(f.type.toLowerCase()));
    if (invalidFiles.length > 0) {
      setErrorMessage('Format gambar tidak didukung. Harap gunakan format JPG, PNG, WebP, atau AVIF.');
      return;
    }

    const remainingQuota = maxFiles - currentUrls.length;
    if (remainingQuota <= 0) {
      setErrorMessage(`Batas maksimal ${maxFiles} gambar telah tercapai.`);
      return;
    }
    const finalFiles = filesToUpload.slice(0, remainingQuota);

    const objectUrls = finalFiles.map((f) => URL.createObjectURL(f));
    setLocalPreviews(objectUrls);
    setIsUploading(true);

    try {
      const newUploadedUrls: string[] = [];

      for (let i = 0; i < finalFiles.length; i++) {
        const rawFile = finalFiles[i];
        const isAvatar = folder === 'avatars';
        const isLandscapeCard = folder === 'meetups' || folder === 'forums' || folder === 'experiences';
        const maxW = isAvatar ? 800 : isLandscapeCard ? 1200 : 1600;
        const maxH = isAvatar ? 800 : isLandscapeCard ? 800 : 1200;
        const file = await compressImage(
          rawFile,
          maxW,
          maxH,
          0.82
        );

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder || 'avatars');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await res.text();
          console.error('Server non-JSON response:', errorText);
          throw new Error(`Server error (${res.status}). Payload mungkin terlalu besar.`);
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal mengunggah gambar.');
        }

        const uploaded = data.url || (Array.isArray(data.urls) && data.urls[0]);
        if (uploaded) {
          newUploadedUrls.push(uploaded);
        }
      }

      const nextUrls = [...currentUrls, ...newUploadedUrls];
      onChange(nextUrls);
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat mengunggah gambar.');
    } finally {
      setIsUploading(false);
      setLocalPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple) {
        handleUploadFiles(Array.from(e.dataTransfer.files));
      } else {
        processFile(e.dataTransfer.files[0]);
      }
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveSingle = (indexToRemove: number) => {
    if (disabled || isUploading) return;
    if (multiple) {
      const filtered = currentUrls.filter((_, idx) => idx !== indexToRemove);
      onChange(filtered);
    } else {
      onChange('');
    }
  };

  const isFull = multiple && currentUrls.length >= maxFiles;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header Label & Description */}
      {(label || description) && (
        <div className="flex items-center justify-between">
          <div>
            {label && (
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>{label}</span>
              </label>
            )}
            {description && (
              <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          {multiple && (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {currentUrls.length} dari {maxFiles} gambar
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="font-medium">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-rose-400 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Area Drag & Drop */}
      {!isFull && (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? 'border-purple-600 bg-purple-50/50 scale-[0.99]'
              : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50/50'
          } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/avif"
            multiple={multiple}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                if (multiple) {
                  handleUploadFiles(Array.from(e.target.files));
                } else {
                  processFile(e.target.files[0]);
                }
              }
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3 shadow-xs">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <p className="text-sm font-bold text-slate-800">
            <span className="text-purple-600">Klik untuk memilih berkas</span> atau seret &amp; lepas ke sini
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {isUploading ? 'Sedang mengunggah gambar...' : 'Format didukung: JPG, PNG, WebP, AVIF (Maks. 5 MB per gambar)'}
          </p>
        </div>
      )}

      {/* Grid Thumbnail Preview jika tidak hidePreview */}
      {!hidePreview && displayUrls.length > 0 && (
        <div
          className={`grid gap-3 pt-1 ${
            multiple
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
              : 'grid-cols-1 max-w-sm'
          }`}
        >
          {displayUrls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs"
            >
              <img
                src={url}
                alt={`Uploaded image ${idx + 1}`}
                className="w-full h-full object-cover transition group-hover:scale-105 duration-300"
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholders/meetup-default.jpg';
                }}
              />
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSingle(idx);
                  }}
                  disabled={disabled || isUploading}
                  className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition transform hover:scale-110 cursor-pointer"
                  title="Hapus gambar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/70 text-[10px] text-white font-medium backdrop-blur-xs">
                #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
