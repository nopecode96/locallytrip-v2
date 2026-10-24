'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

interface ContactFormProps {
  t: {
    formTitle: string;
    formSubtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailFieldLabel: string;
    emailPlaceholder: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    catBooking: string;
    catHost: string;
    catPartnership: string;
    catAccount: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButton: string;
    submitting: string;
    successMessage: string;
  };
}

export function ContactForm({ t }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'booking',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate reliable dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        category: 'booking',
        message: '',
      });
    }, 700);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t.formTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.formSubtitle}</p>
      </div>

      {isSubmitted ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Pesan Terkirim</span>
          </div>
          <p className="text-xs leading-relaxed text-emerald-700">{t.successMessage}</p>
          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="text-xs font-semibold text-emerald-800 underline hover:no-underline pt-1"
          >
            Kirim pesan lainnya
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">{t.nameLabel}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.namePlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">{t.emailFieldLabel}</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">{t.categoryLabel}</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition bg-white"
            >
              <option value="booking">{t.catBooking}</option>
              <option value="host">{t.catHost}</option>
              <option value="partnership">{t.catPartnership}</option>
              <option value="account">{t.catAccount}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">{t.messageLabel}</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={t.messagePlaceholder}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-violet-500/20 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? t.submitting : t.submitButton}</span>
          </button>
        </form>
      )}
    </div>
  );
}
