'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImagesChange?: (images: string[]) => void;
  placeholder?: string;
  folder?: string;
  disabled?: boolean;
  minHeight?: string;
  label?: string;
}

/**
 * Ekstraksi urutan URL gambar dari string HTML menggunakan DOMParser di browser
 */
function extractImageUrls(html: string): string[] {
  if (typeof window === 'undefined' || !html) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imgTags = Array.from(doc.querySelectorAll('img'));
    return imgTags
      .map((img) => img.getAttribute('src'))
      .filter((src): src is string => Boolean(src && src.trim()));
  } catch (err) {
    console.warn('Failed to parse images from HTML:', err);
    return [];
  }
}

export function RichTextEditor({
  value,
  onChange,
  onImagesChange,
  placeholder = 'Tuliskan cerita atau pertanyaan Anda di sini...',
  folder = 'general',
  disabled = false,
  minHeight = '240px',
  label,
}: RichTextEditorProps) {
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-600 underline font-medium hover:text-purple-800 transition',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full h-auto my-6 shadow-md border border-slate-200/80 mx-auto block object-cover',
          loading: 'lazy',
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      // Bila editor kosong (hanya <p></p>), kirimkan string kosong
      const isEmpty = ed.isEmpty;
      const cleanHtml = isEmpty ? '' : html;
      onChange(cleanHtml);

      if (onImagesChange) {
        const urls = extractImageUrls(cleanHtml);
        onImagesChange(urls);
      }
    },
  });

  // Sinkronisasi value eksternal jika berubah dari luar
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '', { emitUpdate: false });
      if (onImagesChange) {
        const urls = extractImageUrls(value || '');
        onImagesChange(urls);
      }
    }
  }, [value, editor, onImagesChange]);

  // Sinkronisasi status disabled
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  // Handle upload gambar lewat input berkas
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editor) return;

    setUploadError(null);
    setIsUploadingImage(true);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengunggah gambar.');
      }

      const uploadedUrl = data.url || (Array.isArray(data.urls) ? data.urls[0] : null);
      if (!uploadedUrl) {
        throw new Error('URL gambar tidak ditemukan dari respon server.');
      }

      // Sisipkan gambar tepat di posisi kursor
      editor
        .chain()
        .focus()
        .setImage({ src: uploadedUrl, alt: file.name.replace(/\.[^/.]+$/, '') || 'Gambar Konten' })
        .run();

      // Trigger update image list
      setTimeout(() => {
        const currentHtml = editor.getHTML();
        onChange(currentHtml);
        if (onImagesChange) {
          onImagesChange(extractImageUrls(currentHtml));
        }
      }, 50);
    } catch (err: any) {
      console.error('RichTextEditor Image Upload Error:', err);
      setUploadError(err.message || 'Gagal mengunggah gambar.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan tautan URL (misal: https://...):', previousUrl);

    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const validUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
      ? url
      : `https://${url}`;

    editor.chain().focus().extendMarkRange('link').setLink({ href: validUrl }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex items-center justify-center text-slate-400 text-sm animate-pulse"
        style={{ minHeight }}
      >
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-purple-600" />
        <span>Menyiapkan editor...</span>
      </div>
    );
  }

  const currentTextLength = editor.getText().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full space-y-2">
      {/* Header bar: Label & Switcher Mode (✍️ Tulis vs 👁️ Pratinjau) */}
      <div className="flex items-center justify-between gap-3">
        {label ? (
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            {label}
          </label>
        ) : <div />}

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
              viewMode === 'write'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>✍️</span>
            <span>Tulis</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
              viewMode === 'preview'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>👁️</span>
            <span>Pratinjau</span>
          </button>
        </div>
      </div>

      {/* Editor Container Box */}
      <div className="w-full border border-slate-200/90 rounded-2xl bg-white shadow-2xs overflow-hidden focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
        {viewMode === 'write' ? (
          <>
            {/* Sticky/Fixed Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-100 text-slate-700">
              {/* Heading 2 */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                disabled={disabled}
                className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  editor.isActive('heading', { level: 2 })
                    ? 'bg-purple-100 text-purple-900 shadow-2xs'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
                title="Heading 2 (Judul Bagian)"
              >
                <Heading2 className="w-4 h-4" />
              </button>

              {/* Heading 3 */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                disabled={disabled}
                className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  editor.isActive('heading', { level: 3 })
                    ? 'bg-purple-100 text-purple-900 shadow-2xs'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
                title="Heading 3 (Sub-judul)"
              >
                <Heading3 className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Bold */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={disabled}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  editor.isActive('bold')
                    ? 'bg-purple-100 text-purple-900 shadow-2xs'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
                title="Tebal (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={disabled}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  editor.isActive('italic')
                    ? 'bg-purple-100 text-purple-900 shadow-2xs'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
                title="Miring (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Bullet List */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                disabled={disabled}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  editor.isActive('bulletList')
                    ? 'bg-purple-100 text-purple-900 shadow-2xs'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
                title="Daftar Poin (Bullet List)"
              >
                <List className="w-4 h-4" />
              </button>

              {/* Ordered List */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                disabled={disabled}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  editor.isActive('orderedList')
                    ? 'bg-purple-100 text-purple-900 shadow-2xs'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
                title="Daftar Nomor (Numbered List)"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              {/* Blockquote */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                disabled={disabled}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  editor.isActive('blockquote')
                    ? 'bg-purple-100 text-purple-900 shadow-2xs'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
                title="Kutipan (Quote)"
              >
                <Quote className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Link */}
              <button
                type="button"
                onClick={setLink}
                disabled={disabled}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  editor.isActive('link')
                    ? 'bg-purple-100 text-purple-900 shadow-2xs'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
                title="Tautkan Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>

              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  disabled={disabled}
                  className="p-2 rounded-lg hover:bg-slate-200/70 text-slate-700 transition cursor-pointer"
                  title="Hapus Link"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              )}

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Tombol Unggah Gambar Inline */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploadingImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                title="Sisipkan Foto / Ilustrasi ke Dalam Teks"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                )}
                <span>{isUploadingImage ? 'Mengunggah...' : 'Sisipkan Foto'}</span>
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Undo / Redo */}
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={disabled || !editor.can().undo()}
                className="p-2 rounded-lg hover:bg-slate-200/70 text-slate-600 transition disabled:opacity-40 cursor-pointer"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={disabled || !editor.can().redo()}
                className="p-2 rounded-lg hover:bg-slate-200/70 text-slate-600 transition disabled:opacity-40 cursor-pointer"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 text-xs text-rose-600 flex items-center justify-between">
                <span>{uploadError}</span>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-2"
                >
                  ×
                </button>
              </div>
            )}

            {/* Area Pengetikan Editor */}
            <div className="p-4 sm:p-5" style={{ minHeight }}>
              <EditorContent
                editor={editor}
                className="tiptap-content prose max-w-none focus:outline-none text-slate-800 leading-relaxed text-sm sm:text-base min-h-[180px]"
              />
            </div>
          </>
        ) : (
          /* Mode Pratinjau (Preview) */
          <div className="p-5 sm:p-6 bg-white" style={{ minHeight }}>
            {value && value.trim() ? (
              <div
                className="rich-text-body text-slate-800 leading-relaxed max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
              />
            ) : (
              <div className="text-center py-16 text-slate-400 text-sm italic space-y-2">
                <p>Belum ada tulisan untuk dipratinjau.</p>
                <p className="text-xs text-slate-400 font-normal">
                  Mulai menulis di tab &quot;✍️ Tulis&quot; untuk melihat tampilannya di sini.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer info panduan paste dari Docs / AI */}
        <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>
              {viewMode === 'write'
                ? 'Mendukung paste otomatis dari Google Docs, ChatGPT, & Notion.'
                : 'Mode Pratinjau Tampilan Pembaca'}
            </span>
          </span>
          <span>{currentTextLength} kata</span>
        </div>
      </div>
    </div>
  );
}

export const MarkdownEditor = RichTextEditor;
export default RichTextEditor;

