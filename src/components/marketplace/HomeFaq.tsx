'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';
import { Dictionary } from '@/lib/dictionary';

interface HomeFaqProps {
  dict: Dictionary;
}

export function HomeFaq({ dict }: HomeFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const homeFaq = dict.home_faq;
  const faqItems = homeFaq?.items && homeFaq.items.length > 0
    ? homeFaq.items
    : [
        {
          q:
            dict.faq?.q1 ||
            'Bagaimana Locallytrip memverifikasi para pemandu lokal (Host)?',
          a:
            dict.faq?.a1 ||
            'Setiap pemandu lokal wajib melewati proses verifikasi identitas resmi (KYC) berbasis AI, wawancara kurasi wawasan lokal, serta peninjauan catatan keamanan sebelum diizinkan membuka pendaftaran aktivitas tur.',
        },
        {
          q:
            dict.faq?.q2 ||
            'Bagaimana sistem garansi dan keamanan pembayaran?',
          a:
            dict.faq?.a2 ||
            'Locallytrip menerapkan sistem rekening penampung bersama (escrow). Dana pembayaran Anda ditahan secara aman dan baru diteruskan ke pemandu setelah aktivitas selesai diselenggarakan sesuai komitmen.',
        },
        {
          q:
            dict.faq?.q3 ||
            'Apa itu poin reward LTP dan bagaimana cara menggunakannya?',
          a:
            dict.faq?.a3 ||
            'LTP (Locallytrip Points) adalah poin loyalitas yang Anda dapatkan di setiap transaksi pemesanan maupun kontribusi komunitas. Poin ini dapat ditukarkan langsung sebagai potongan harga hingga 50% untuk pesanan berikutnya.',
        },
        {
          q:
            dict.faq?.q4 ||
            'Apakah saya bisa memesan tur privat atau custom itinerary?',
          a:
            dict.faq?.a4 ||
            'Ya, tentu saja! Anda dapat memanfaatkan fitur Chat Langsung sebelum memesan untuk mendiskusikan rute khusus, durasi, atau penyesuaian khusus keluarga dengan Host bersangkutan.',
        },
      ];

  return (
    <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-20">
      {/* Header FAQ (AEO & E-E-A-T Target) */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{homeFaq?.badge || 'Trust, Safety & E-E-A-T'}</span>
        </div>
        <h2 className="heading-h2 text-slate-900">
          {homeFaq?.title || dict.home?.faqSectionTitle || 'Pertanyaan yang Sering Diajukan (FAQ)'}
        </h2>
        <p className="text-body text-slate-500 mt-2 max-w-xl mx-auto">
          {homeFaq?.subtitle ||
            dict.home?.faqSectionSub ||
            'Informasi transparan mengenai standar keamanan, kurasi pemandu, dan garansi layanan Locallytrip.'}
        </p>
      </div>

      {/* Accordion FAQ Items */}
      <div className="w-full space-y-4">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left flex items-center justify-between gap-4 cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-3">
                  <HelpCircle
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isOpen ? 'text-violet-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.q}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-violet-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-4 pl-7">
                  <div>{item.a}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
