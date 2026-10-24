'use client';

import React from 'react';
import { ExperienceItem } from '@/actions/experiences';
import { ExperienceCard } from './ExperienceCard';
import { Dictionary } from '@/lib/dictionary';
import { Compass } from 'lucide-react';

interface ExperienceGridProps {
  experiences: ExperienceItem[];
  dict?: Dictionary['common'];
  homeDict?: Dictionary['home'];
  noExperiencesText?: string;
  noExperiencesSubText?: string;
}

export function ExperienceGrid({
  experiences,
  dict,
  homeDict,
  noExperiencesText = 'Belum ada aktivitas yang tersedia.',
  noExperiencesSubText = 'Coba ubah filter atau kata kunci pencarian Anda.',
}: ExperienceGridProps) {
  if (!experiences || experiences.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
        <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">
          {noExperiencesText}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {noExperiencesSubText}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {experiences.map((exp) => (
        <ExperienceCard
          key={exp.id}
          experience={exp}
          dict={dict}
          homeDict={homeDict}
        />
      ))}
    </div>
  );
}
