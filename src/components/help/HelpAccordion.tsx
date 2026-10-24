'use client';

import React, { useState } from 'react';
import { ChevronDown, Search, Users, ShieldCheck, Coins, Compass, Sparkles, HelpCircle } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'travelers' | 'hosts' | 'gamification' | 'operational';
  question: string;
  answer: string;
}

interface HelpAccordionProps {
  items: FaqItem[];
  t: {
    searchPlaceholder: string;
    tabAll: string;
    tabTravelers: string;
    tabHosts: string;
    tabGamification: string;
    tabOperational: string;
  };
}

export function HelpAccordion({ items, t }: HelpAccordionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'q1': true,
    'q2': false,
    'q4': true,
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const tabs = [
    { id: 'all', label: t.tabAll, icon: Compass, count: items.length },
    {
      id: 'travelers',
      label: t.tabTravelers,
      icon: Users,
      count: items.filter((i) => i.category === 'travelers').length,
    },
    {
      id: 'hosts',
      label: t.tabHosts,
      icon: ShieldCheck,
      count: items.filter((i) => i.category === 'hosts').length,
    },
    {
      id: 'gamification',
      label: t.tabGamification,
      icon: Coins,
      count: items.filter((i) => i.category === 'gamification').length,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Search Input Hero Full Width */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-13 pr-6 py-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
        />
      </div>

      {/* Grid 12 Kolom: Sidebar Kategori (4/12) & Accordion (8/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDEBAR NAVIGASI KATEGORI (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
              Kategori Bantuan
            </h3>
            <div className="space-y-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-violet-700 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tips Bantuan Box */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-6 border border-violet-100 space-y-2.5">
            <div className="flex items-center gap-2 text-violet-700 text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tips Cepat</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gunakan kata kunci singkat seperti <span className="font-semibold text-slate-800">"refund"</span>, <span className="font-semibold text-slate-800">"escrow"</span>, atau <span className="font-semibold text-slate-800">"komisi"</span> untuk menemukan jawaban instan.
            </p>
          </div>
        </div>

        {/* ACCORDION TANYA JAWAB (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-3.5">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">Tidak ada pertanyaan yang sesuai</p>
              <p className="text-slate-400 text-xs">Coba ubah kata kunci pencarian Anda atau pilih kategori lain.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isOpen = openIds[item.id] || false;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 text-left font-bold text-slate-900 text-xs sm:text-sm hover:text-violet-600 transition"
                  >
                    <span className="leading-snug">{item.question}</span>
                    <div
                      className={`w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-violet-100 text-violet-700' : 'text-slate-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
