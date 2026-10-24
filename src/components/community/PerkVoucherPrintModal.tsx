'use client';

import React from 'react';
import {
  Ticket,
  Printer,
  X,
  Info,
  Store,
  Globe,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { UserPerkClaim } from './PerksClient';

// Vector Barcode Renderer Component
export function BarcodeView({ code }: { code: string }) {
  const bars = React.useMemo(() => {
    const chars = (code || 'VOUCHER').toUpperCase().split('');
    const pattern: number[] = [2, 1, 3, 1, 1]; // start guard
    chars.forEach((c) => {
      const codeVal = c.charCodeAt(0);
      pattern.push((codeVal % 3) + 1);
      pattern.push(((codeVal >> 1) % 2) + 1);
      pattern.push(((codeVal >> 2) % 3) + 1);
      pattern.push(1);
    });
    pattern.push(3, 1, 2, 2); // stop guard
    return pattern;
  }, [code]);

  return (
    <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-slate-200">
      <div className="flex items-stretch h-11 gap-[1.5px] max-w-full overflow-hidden">
        {bars.map((width, idx) => (
          <div
            key={idx}
            className={`h-full ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-transparent'}`}
            style={{ width: `${width * 1.8}px` }}
          />
        ))}
      </div>
      <div className="font-mono text-[10px] font-bold tracking-widest text-slate-700 mt-1 select-all">
        {code}
      </div>
    </div>
  );
}

// Vector QR Code Box Renderer Component
export function QrCodeBox({ code }: { code: string }) {
  return (
    <div className="w-20 h-20 p-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0">
      <svg viewBox="0 0 33 33" className="w-full h-full text-slate-900 fill-current">
        <path d="M0 0h9v9H0zm2 2h5v5H2z" />
        <path d="M3 3h3v3H3z" />
        <path d="M24 0h9v9h-9zm2 2h5v5h-5z" />
        <path d="M27 3h3v3h-3z" />
        <path d="M0 24h9v9H0zm2 2h5v5H2z" />
        <path d="M3 27h3v3H3z" />
        <path d="M12 2h2v2h-2zM16 2h1v2h-1zM19 2h2v2h-2zM12 6h3v2h-3zM18 5h2v3h-2zM2 12h2v2H2zM6 12h3v1H6zM11 11h2v2h-2zM15 11h3v2h-3zM20 12h2v2h-2zM25 11h2v3h-2zM29 12h2v2h-2zM3 15h2v2H3zM7 16h2v2H7zM11 15h3v2h-3zM17 15h2v3h-2zM22 15h2v2h-2zM27 15h3v2h-3zM1 19h2v2H1zM5 19h2v2H5zM12 19h2v2h-2zM16 18h3v3h-3zM21 19h2v2h-2zM26 19h2v2h-2zM29 19h3v2h-3zM12 23h3v2h-3zM17 24h2v2h-2zM21 23h2v2h-2zM25 24h2v2h-2zM11 27h2v2h-2zM15 27h3v2h-3zM20 28h2v2h-2zM24 27h3v3h-3zM29 27h2v2h-2zM12 30h2v2h-2zM17 30h3v2h-3zM22 31h2v2h-2zM26 31h3v2h-3z" />
      </svg>
      <span className="text-[8px] font-mono text-slate-400 mt-0.5 uppercase">Scan QR</span>
    </div>
  );
}

interface PerkVoucherPrintModalProps {
  claim: UserPerkClaim | null;
  isOpen: boolean;
  onClose: () => void;
  isId?: boolean;
}

export function PerkVoucherPrintModal({
  claim,
  isOpen,
  onClose,
  isId = true,
}: PerkVoucherPrintModalProps) {
  if (!isOpen || !claim) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Top Action Bar for Screen (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-xs sm:text-sm">
              {isId ? 'Tiket Voucher Resmi Siap Cetak' : 'Official Printable Voucher Ticket'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>{isId ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Voucher Container */}
        <div
          id="printable-perk-voucher"
          className="p-6 sm:p-8 space-y-6 bg-white text-slate-900 border-2 border-dashed border-purple-200 sm:m-4 rounded-2xl relative"
        >
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-xl text-purple-950 tracking-tight">
                  Locally<span className="text-purple-600">trip</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Community Perk Pass
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isId
                  ? 'Voucher Resmi Program Reward Komunitas'
                  : 'Official Community Rewards Voucher'}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">
                {claim.partner_name || 'Brand Partner'}
              </div>
              {claim.partner_category && (
                <div className="text-[10px] text-purple-600 font-semibold uppercase">
                  {claim.partner_category}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Title & Code */}
          <div className="space-y-2 text-center">
            <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-950">
              {claim.campaign_title || 'Voucher Diskon Spesial Mitra'}
            </h3>
            <p className="text-xs text-slate-500">
              {isId
                ? 'Tunjukkan tiket ini saat bertransaksi di outlet resmi atau gunakan secara online'
                : 'Present this voucher ticket at partner branches or apply online'}
            </p>

            {/* Big Code Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-purple-300 my-4 inline-block w-full">
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-1">
                {isId ? 'KODE VOUCHER' : 'VOUCHER CODE'}
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-purple-950 tracking-widest select-all">
                {claim.voucher_code}
              </div>
            </div>
          </div>

          {/* Barcode & QR Code Section */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full text-center sm:text-left space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isId ? 'Barcode Pindai Kasir' : 'Cashier Barcode Scan'}
              </div>
              <BarcodeView code={claim.voucher_code} />
            </div>
            <div className="flex flex-col items-center">
              <QrCodeBox code={claim.voucher_code} />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-700">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-600" />
              <span>{isId ? 'Panduan Penggunaan Voucher:' : 'Redemption Guide:'}</span>
            </div>
            <div className="space-y-2 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <Store className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">
                    {isId
                      ? '1. Di Gerai / Outlet Fisik (Offline):'
                      : '1. At Physical Stores (Offline):'}
                  </strong>{' '}
                  {isId
                    ? 'Tunjukkan tiket/barcode ini kepada kasir gerai resmi sebelum tagihan dicetak. Kasir akan memindai atau mencatat kode voucher Anda.'
                    : 'Show this voucher barcode to cashier before billing. The cashier will scan or note down the code.'}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">
                    {isId
                      ? '2. Di Website / Aplikasi Resmi Mitra (Online):'
                      : '2. At Brand Website/App (Online):'}
                  </strong>{' '}
                  {isId
                    ? 'Ketik atau tempel kode voucher ini pada kolom Kupon Promo saat proses pembayaran checkout online.'
                    : 'Type or paste this voucher code into the promo/coupon code field during checkout.'}
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Footer */}
          <div className="space-y-1.5 border-t border-slate-200 pt-3 text-[10px] text-slate-500">
            {claim.terms && (
              <p className="leading-relaxed">
                <strong>{isId ? 'Syarat & Ketentuan:' : 'Terms:'}</strong> {claim.terms}
              </p>
            )}
            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
              <span>
                Diterbitkan: {new Date(claim.claimed_at).toLocaleDateString(isId ? 'id-ID' : 'en-US')}
              </span>
              <span>ID: LT-PERK-{claim.voucher_code}</span>
              <span className="text-emerald-600 font-bold">VERIFIED LOCALLYTRIP</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions on Screen (Hidden on print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {isId ? 'Gunakan dialog cetak browser untuk menyimpan PDF' : 'Use browser print dialog to save as PDF'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              {isId ? 'Tutup' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isId ? 'Cetak Sekarang' : 'Print Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Print CSS Injection */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-perk-voucher,
          #printable-perk-voucher * {
            visibility: visible !important;
          }
          #printable-perk-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: 2px dashed #7e22ce !important;
            border-radius: 16px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
