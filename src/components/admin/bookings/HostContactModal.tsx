'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  User,
  Compass,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';
import { AdminBookingItem } from '@/actions/admin/bookings';
import { getPublicImageUrl } from '@/lib/images';
import { resolveAvatarUrl } from '@/lib/avatar';

interface HostContactModalProps {
  booking: AdminBookingItem | null;
  onClose: () => void;
}

export function formatWhatsAppUrl(
  phone: string | null,
  hostName: string,
  ref: string,
  experienceTitle: string,
  travellerName: string
): string | null {
  if (!phone) return null;

  // Bersihkan semua karakter selain angka
  let digits = phone.replace(/\D/g, '');

  // Format nomor Indonesia jika diawali 0 (e.g. 0812345678 -> 62812345678)
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (!digits.startsWith('62') && digits.length <= 11) {
    // Fallback default Indonesia jika 10-11 digit tanpa 0/62
    digits = '62' + digits;
  }

  const message = `Halo ${hostName}, Tim Operasional Locallytrip menghubungi Anda terkait pesanan #${ref} ("${experienceTitle}"). Traveller: ${travellerName}. Mohon konfirmasi kesiapan Anda untuk trip ini. Terima kasih!`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function HostContactModal({ booking, onClose }: HostContactModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!booking) return null;

  const host = booking.host;
  const waUrl = formatWhatsAppUrl(
    host?.phone || null,
    host?.name || 'Host',
    booking.booking_reference,
    booking.experience.title,
    booking.traveller.name
  );

  const emailSubject = `[Locallytrip Ops] Booking #${booking.booking_reference} - ${booking.experience.title}`;
  const emailBody = `Halo ${host?.name || 'Host'},\n\nKami dari Tim Operasional Locallytrip menghubungi Anda terkait pesanan berikut:\n- No. Referensi: #${booking.booking_reference}\n- Aktivitas: ${booking.experience.title}\n- Pelanggan: ${booking.traveller.name} (${booking.traveller.email})\n- Tanggal Trip: ${booking.selected_date ? new Date(booking.selected_date).toLocaleDateString('id-ID') : 'Belum ditentukan'}\n- Jumlah Peserta: ${booking.participant_count} Orang\n- Total: $${booking.total_price} USD\n\nMohon konfirmasi status dan kesiapan Anda melalui email ini atau kontak admin Locallytrip.\n\nSalam Hangat,\nTim Operasional Locallytrip`;
  const mailtoUrl = host?.email
    ? `mailto:${host.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : null;

  const handleCopyPhone = () => {
    if (host?.phone) {
      navigator.clipboard.writeText(host.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 shadow-2xl space-y-6 relative"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/5 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Staff Quick-Contact Tool
              </span>
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
                Host Direct Telemetry
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Host Profile Card */}
          {host ? (
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-black text-base text-purple-700 dark:text-purple-300 shrink-0">
                  <img
                    src={resolveAvatarUrl(host)}
                    alt={host.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== '/images/default-avatar.png') {
                        target.src = '/images/default-avatar.png';
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {host.name}
                    </h3>
                    {host.is_verified && (
                      <span title="Verified Host">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{host.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                      {host.phone || 'No phone recorded'}
                    </span>
                    {host.phone && (
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                        title="Copy phone"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Tour Host
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
              <span>Host information is not linked to this experience or host account was deleted.</span>
            </div>
          )}

          {/* Booking Context Preview */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Associated Booking Context
            </span>
            <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Reference:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {booking.booking_reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tour Experience:</span>
                <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[260px]">
                  {booking.experience.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Traveller:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {booking.traveller.name} ({booking.traveller.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trip Schedule:</span>
                <span className="font-medium">
                  {booking.selected_date
                    ? new Date(booking.selected_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}{' '}
                  • {booking.participant_count} Pax
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200/50 dark:border-white/5 pt-1.5">
                <span className="text-gray-400">Total Settlement:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  ${booking.total_price} USD
                </span>
              </div>
            </div>
          </div>

          {/* Host Quick-Contact Action Buttons */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Emergency Contact Channels
            </span>

            {/* Action 1: WhatsApp Direct Link */}
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/25 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-white/20">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block">Chat on WhatsApp</span>
                    <span className="text-[10px] font-normal text-emerald-100">
                      Pre-filled with booking #{booking.booking_reference}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : (
              <div className="w-full py-2.5 px-4 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 text-xs flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Unavailable (No Phone Number)
                </span>
                <span className="text-[10px] uppercase font-bold">Offline</span>
              </div>
            )}

            {/* Action 2: Direct Mailto */}
            {mailtoUrl ? (
              <a
                href={mailtoUrl}
                className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-600/25 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-white/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block">Send Priority Email</span>
                    <span className="text-[10px] font-normal text-purple-100">
                      Direct to {host?.email}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : null}

            {/* Action 3: Direct Phone Call */}
            {host?.phone ? (
              <a
                href={`tel:${host.phone}`}
                className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-teal-600/25 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-white/20">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block">Direct Cellular Call</span>
                    <span className="text-[10px] font-normal text-teal-100">
                      {host.phone}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-teal-200 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : null}
          </div>

          {/* Footer Close */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 text-xs font-bold transition"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
