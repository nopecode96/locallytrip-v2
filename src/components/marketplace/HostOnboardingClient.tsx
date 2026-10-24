'use client';

import React, { useState } from 'react';
import { generateAndSaveAiExperience, StructuredAiExperience } from '@/actions/experiences/ai-builder';
import { Sparkles, Wand2, CheckCircle2, ArrowRight, Loader2, Compass, MapPin, Clock, Users, Coins } from 'lucide-react';
import Link from 'next/link';
import { usePreferences } from '@/components/layout/PreferencesContext';

interface CityOption {
  id: number;
  name: string;
}

interface HostOnboardingClientProps {
  cities: CityOption[];
  locale: string;
}

export function HostOnboardingClient({ cities, locale }: HostOnboardingClientProps) {
  const { formatPrice } = usePreferences();

  // Form State
  const [draftTitle, setDraftTitle] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<number>(cities[0]?.id || 4);
  const [rawStory, setRawStory] = useState('');
  const [isPublishingDirectly, setIsPublishingDirectly] = useState(false);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    experienceId: number;
    slug: string;
    aiExtraction: StructuredAiExperience;
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsGenerating(true);

    const res = await generateAndSaveAiExperience({
      draftTitle,
      cityId: Number(selectedCityId),
      rawStory,
      publishDirectly: isPublishingDirectly,
    });

    setIsGenerating(false);

    if (res.success && res.data) {
      setGeneratedResult(res.data);
    } else {
      setErrorMsg(res.error || 'Gagal menghasilkan produk host.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold tracking-wide">
          <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI Host Product Builder</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Ceritakan Aktivitasmu, Biarkan AI Menyusun Etalasenya
        </h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          Cukup tuliskan ide aktivitas Anda dengan bahasa santai. Mesin AI Gemini Flash akan otomatis menyusun rincian fasilitas, estimasi harga IDR, dan format multibahasa siap pesan.
        </p>
      </div>

      {!generatedResult ? (
        /* Form Sederhana */
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleGenerate} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Judul Draf */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                1. Judul Draf / Nama Singkat Aktivitas
              </label>
              <input
                type="text"
                required
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="cth: Wisata Kuliner Malam & Cerita Sejarah Braga"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            {/* Pilihan Kota */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Lokasi Kota Aktivitas</span>
              </label>
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Textarea Cerita Santai */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                3. Ceritakan Aktivitas/Tur Anda Secara Santai
              </label>
              <textarea
                required
                rows={5}
                value={rawStory}
                onChange={(e) => setRawStory(e.target.value)}
                placeholder="cth: Saya akan mengajak traveler jalan kaki santai menyusuri gang tua di Braga, mencicipi roti bakar legendaris dan wedang ronde tersembunyi. Nanti ada sesi foto dokumentasi polaroid dan ngobrol seru bareng seniman lokal di kedai kopi..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition leading-relaxed"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                *Tips: Ceritakan apa saja yang akan dikunjungi, apa yang didapat traveler, dan durasi perkiraannya.
              </span>
            </div>

            {/* Toggle Publikasikan Langsung */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <input
                type="checkbox"
                id="publishDirectly"
                checked={isPublishingDirectly}
                onChange={(e) => setIsPublishingDirectly(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="publishDirectly" className="text-xs font-semibold text-emerald-950 cursor-pointer">
                Publikasikan langsung ke marketplace setelah diekstrak oleh AI (Status: Published)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm transition shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Gemini Sedang Menganalisis & Menyusun Produk...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-white" />
                  <span>Ekstrak & Simpan Produk Wisata</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Hasil Ekstraksi AI Berhasil */
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Produk Berhasil Diekstrak & Tersimpan di Database!</h3>
              <p className="text-xs text-emerald-700">
                AI telah memetakan narasi santai Anda ke skema terstruktur platform.
              </p>
            </div>
          </div>

          {/* Rincian Hasil AI */}
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-5 space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600">
                Judul Multibahasa Teroptimasi
              </span>
              <h2 className="text-2xl font-black text-gray-900">
                {generatedResult.aiExtraction.title_id}
              </h2>
              <p className="text-xs text-gray-500 italic">
                English: &ldquo;{generatedResult.aiExtraction.title_en}&rdquo;
              </p>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl text-center">
                <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-gray-400 font-semibold block">Durasi</span>
                <span className="text-sm font-bold text-gray-800">
                  {generatedResult.aiExtraction.duration_hours} Jam
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-center">
                <Users className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <span className="text-xs text-gray-400 font-semibold block">Kapasitas</span>
                <span className="text-sm font-bold text-gray-800">
                  Maks {generatedResult.aiExtraction.max_participants} Orang
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-center col-span-2">
                <Coins className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <span className="text-xs text-gray-400 font-semibold block">Saran Harga</span>
                <span className="text-base font-black text-emerald-700">
                  Rp {generatedResult.aiExtraction.suggested_price_idr.toLocaleString('id-ID')}
                  <span className="text-xs text-gray-400 font-normal"> (${generatedResult.aiExtraction.suggested_price_usd} USD)</span>
                </span>
              </div>
            </div>

            {/* Yang Didapatkan & Fasilitas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Termasuk (Included):
                </span>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {generatedResult.aiExtraction.included_items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tidak Termasuk (Excluded):
                </span>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {generatedResult.aiExtraction.excluded_items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setGeneratedResult(null);
                  setRawStory('');
                  setDraftTitle('');
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
              >
                Buat Aktivitas Lain
              </button>

              <Link
                href={`/${locale}/experiences/${generatedResult.slug}`}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <span>Lihat Produk di Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
