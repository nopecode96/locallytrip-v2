'use client';

import React, { useState } from 'react';
import { approveKyc, rejectKyc, AdminKycItem } from '@/actions/admin/kyc';
import {
  ShieldCheck,
  ShieldX,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface KycClientViewProps {
  initialQueue: AdminKycItem[];
}

export function KycClientView({ initialQueue }: KycClientViewProps) {
  const [queue, setQueue] = useState<AdminKycItem[]>(initialQueue);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [activeDocPreview, setActiveDocPreview] = useState<string | null>(null);
  const [rejectModalKyc, setRejectModalKyc] = useState<AdminKycItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const handleApprove = async (kycId: number) => {
    setProcessingId(kycId);
    const res = await approveKyc(kycId);
    setProcessingId(null);
    if (res.success) {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === kycId
            ? {
                ...item,
                status: 'approved',
                user: { ...item.user, isVerified: true, isTrusted: true },
              }
            : item
        )
      );
    } else {
      alert(res.error || 'Gagal menyetujui KYC.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalKyc) return;
    setProcessingId(rejectModalKyc.id);
    const res = await rejectKyc(rejectModalKyc.id, rejectReason);
    setProcessingId(null);
    if (res.success) {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === rejectModalKyc.id ? { ...item, status: 'rejected' } : item
        )
      );
      setRejectModalKyc(null);
      setRejectReason('');
    } else {
      alert(res.error || 'Gagal menolak KYC.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Kurasi Host & Verifikasi KYC
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validasi identitas calon Local Host dari file dokumen di public/images/kyc/ untuk memberikan badge verified.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          Total Antrean: <strong className="text-white">{queue.length} Host</strong>
        </div>
      </div>

      {/* KYC Table List */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
        {queue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-4">Host / Profil</th>
                  <th className="px-5 py-4">Data Identitas</th>
                  <th className="px-5 py-4">Dokumen Fisik</th>
                  <th className="px-5 py-4">Status & Waktu</th>
                  <th className="px-5 py-4 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    {/* Host Profile */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.user.avatarUrl
                              ? `/images/users/avatars/${item.user.avatarUrl}`
                              : '/images/default.jpg'
                          }
                          alt={item.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/default.jpg';
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <span>{item.fullName}</span>
                            {item.user.isVerified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">{item.user.email}</span>
                          <span className="text-[10px] text-slate-400">Kota: {item.city}</span>
                        </div>
                      </div>
                    </td>

                    {/* Data Identitas */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-200 block uppercase">
                          {item.idType}: {item.idNumber}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ID User: #{item.userId}
                        </span>
                      </div>
                    </td>

                    {/* Dokumen Fisik */}
                    <td className="px-5 py-4">
                      {item.documents.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.documents.map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setActiveDocPreview(doc.fileName)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-emerald-400 border border-slate-800 transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span className="uppercase">{doc.documentType}</span>
                              <Eye className="w-2.5 h-2.5 text-slate-500 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Tidak ada lampiran</span>
                      )}
                    </td>

                    {/* Status & Waktu */}
                    <td className="px-5 py-4">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {item.submittedAt
                            ? new Date(item.submittedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {item.status !== 'approved' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={processingId === item.id}
                            onClick={() => handleApprove(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {processingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Setujui</span>
                          </button>

                          <button
                            type="button"
                            disabled={processingId === item.id}
                            onClick={() => setRejectModalKyc(item)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Terverifikasi</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            Tidak ada data permohonan KYC yang perlu ditinjau.
          </div>
        )}
      </div>

      {/* Preview Modal Dokumen KYC */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white truncate">
                Preview Dokumen: {activeDocPreview}
              </h4>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px] border border-slate-800">
              <img
                src={`/images/kyc/${activeDocPreview}`}
                alt="KYC Document Preview"
                className="max-h-[480px] w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/default.jpg';
                }}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-800 space-y-4">
            <h4 className="text-base font-bold text-white">
              Tolak Permohonan KYC ({rejectModalKyc.fullName})
            </h4>
            <p className="text-xs text-slate-400">
              Sertakan catatan atau alasan penolakan agar pemohon dapat memperbaiki dokumen identitasnya.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="cth: Foto KTP buram dan tidak terbaca, silakan unggah ulang dengan pencahayaan memadai..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalKyc(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
