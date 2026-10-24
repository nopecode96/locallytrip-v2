import DOMPurify from 'dompurify';

/**
 * Sanitasi string HTML untuk mencegah XSS.
 * Bekerja baik di client maupun fallback aman di server.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'b', 'i', 'strong', 'em', 'u', 's', 'strike',
        'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'br', 'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height', 'class', 'style', 'loading'
      ],
      ADD_ATTR: ['target', 'rel'],
    });
  }
  // Server-side rudimentary fallback (DOMPurify without jsdom)
  // Strips script tags, on* handlers, and javascript: links
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^"']*/gi, '');
}

/**
 * Mengonversi string HTML menjadi teks bersih tanpa tag HTML
 */
export function stripHtmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<img[^>]*>/gi, '') // Hapus tag <img> terlebih dahulu
    .replace(/<[^>]*>/g, ' ') // Ganti tag HTML dengan spasi
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Rapikan spasi ganda
    .trim();
}

/**
 * Mengekstrak cuplikan teks murni yang bersih dari gambar inline dan tag HTML untuk kartu daftar
 */
export function extractPlainTextSnippet(htmlOrText: string, maxLength: number = 160): string {
  if (!htmlOrText) return '';

  // 1. Hapus seluruh tag <img> beserta atributnya terlebih dahulu
  let clean = htmlOrText.replace(/<img[^>]*>/gi, '');

  // 2. Hapus seluruh tag HTML lainnya
  clean = clean.replace(/<[^>]*>/g, ' ');

  // 3. Decode entitas HTML umum
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 4. Normalisasi format Markdown jika ada
  clean = clean.replace(/[*#_`~>[\]()]/g, ' ');

  // 5. Normalisasi spasi dan baris baru berlebih
  clean = clean.replace(/\s+/g, ' ').trim();

  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '...';
}
