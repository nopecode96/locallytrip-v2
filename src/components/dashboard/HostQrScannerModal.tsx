'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, CheckCircle2, AlertCircle, Keyboard } from 'lucide-react';
import { verifyAndCheckInTicket } from '@/actions/bookings/host-checkin';

interface HostQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingData: any) => void;
  locale?: string;
  initialCode?: string;
}

export default function HostQrScannerModal({
  isOpen,
  onClose,
  onSuccess,
  locale = 'id',
  initialCode = '',
}: HostQrScannerModalProps) {
  const isId = locale === 'id';
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState(initialCode);
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedBooking, setVerifiedBooking] = useState<any | null>(null);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'mobile-qr-reader-region';

  useEffect(() => {
    if (initialCode) {
      setManualCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (!isOpen || mode !== 'camera') {
      stopScanner();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setErrorMessage(null);
        // Pastikan container ada di DOM
        const container = document.getElementById(scannerContainerId);
        if (!container) return;

        // Inisialisasi Html5Qrcode
        const html5QrCode = new Html5Qrcode(scannerContainerId);
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Gunakan kamera belakang HP
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (!isMounted) return;
            // Stop scanning sesaat saat kode terdeteksi
            await stopScanner();
            handleProcessCode(decodedText);
          },
          () => {
            // Abaikan frame drop log
          }
        );
      } catch (err: any) {
        console.error('Kamera gagal diakses:', err);
        if (isMounted) {
          setErrorMessage(
            isId
              ? 'Tidak dapat mengakses kamera HP. Pastikan izin kamera telah diberikan di browser, atau gunakan input kode manual.'
              : 'Unable to access device camera. Please check camera permissions or use manual code entry.'
          );
          setMode('manual');
        }
      }
    };

    // Jalankan scanner setelah DOM terpasang
    const timer = setTimeout(startScanner, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, mode, isId]);

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
        qrScannerRef.current.clear();
      } catch (e) {
        console.warn('Gagal menghentikan scanner:', e);
      }
      qrScannerRef.current = null;
    }
  };

  const handleProcessCode = async (rawCode: string) => {
    if (!rawCode.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setScanResult(rawCode);

    try {
      const res = await verifyAndCheckInTicket(rawCode);
      if (res.success) {
        setVerifiedBooking(res.booking);
        onSuccess(res.booking);
      } else {
        setErrorMessage(res.error || (isId ? 'Verifikasi tiket gagal.' : 'Ticket verification failed.'));
      }
    } catch {
      setErrorMessage(
        isId
          ? 'Terjadi kendala jaringan saat memverifikasi tiket.'
          : 'Network issue while verifying ticket.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode);
  };

  const handleReset = () => {
    setVerifiedBooking(null);
    setScanResult(null);
    setErrorMessage(null);
    setManualCode('');
    setMode('camera');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isId ? 'Scan E-Tiket Tamu' : 'Scan Guest E-Ticket'}
              </h3>
              <p className="text-xs text-slate-500">
                {isId ? 'Pindai QR Code dari layar HP tamu' : 'Scan QR Code from guest phone screen'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Konten Utama */}
        <div className="p-6">
          {/* Kondisi 1: Berhasil Check-in */}
          {verifiedBooking ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                {isId ? 'Check-In Berhasil!' : 'Check-In Successful!'}
              </span>
              <h4 className="text-lg font-bold text-slate-900">
                {verifiedBooking.experiences?.title || 'Tour Experience'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isId ? 'Kode:' : 'Code:'}{' '}
                <span className="font-mono font-bold text-slate-800">
                  {verifiedBooking.booking_reference}
                </span>
              </p>

              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isId ? 'Nama Tamu:' : 'Guest Name:'}</span>
                  <span className="font-semibold text-slate-800">
                    {verifiedBooking.users?.name || (isId ? 'Tamu' : 'Guest')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isId ? 'Peserta Rombongan:' : 'Participants:'}</span>
                  <span className="font-semibold text-slate-800">
                    {verifiedBooking.participant_count} {isId ? 'Orang (Paket Privat)' : 'Guests (Private)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isId ? 'Status Pembayaran:' : 'Payment Status:'}</span>
                  <span className="font-semibold text-emerald-600 uppercase">
                    {verifiedBooking.payments?.[0]?.status || 'PAID'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition"
                >
                  {isId ? 'Scan Tiket Lain' : 'Scan Another Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopScanner();
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 shadow-sm cursor-pointer transition"
                >
                  {isId ? 'Selesai' : 'Done'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Pesan Error jika Ada */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              )}

              {/* Pilihan Tab Mode (Kamera vs Input Manual) */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('camera');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    mode === 'camera'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isId ? 'Kamera HP' : 'Device Camera'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopScanner();
                    setErrorMessage(null);
                    setMode('manual');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    mode === 'manual'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>{isId ? 'Ketik Kode' : 'Manual Code'}</span>
                </button>
              </div>

              {/* Mode Kamera Aktif */}
              {mode === 'camera' && (
                <div className="relative">
                  <div
                    id={scannerContainerId}
                    className="w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border-2 border-dashed border-purple-400 relative"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs gap-2 rounded-2xl z-10">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                      <span>{isId ? 'Memverifikasi tiket tamu...' : 'Verifying ticket...'}</span>
                    </div>
                  )}
                  <p className="text-center text-xs text-slate-500 mt-3">
                    {isId
                      ? 'Arahkan kamera ke QR Code di layar HP tamu.'
                      : 'Point the camera at the guest QR Code on their screen.'}
                  </p>
                </div>
              )}

              {/* Mode Input Manual */}
              {mode === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                      {isId ? 'KODE REFERENSI TIKET' : 'TICKET REFERENCE CODE'}
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: LT-659744-589"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !manualCode.trim()}
                    className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isId ? 'Memeriksa Tiket...' : 'Checking Ticket...'}</span>
                      </>
                    ) : (
                      <span>{isId ? 'Verifikasi & Check-In' : 'Verify & Check-In'}</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
