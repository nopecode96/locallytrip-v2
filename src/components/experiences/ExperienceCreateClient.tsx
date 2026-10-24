'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createExperience, CreateExperienceItineraryItem } from '@/actions/experiences/create';
import { updateExperience } from '@/actions/experiences/update';
import { RewardIncentiveCard } from '@/components/rewards/RewardIncentiveCard';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import {
  ArrowLeft,
  Sparkles,
  Compass,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Languages,
  Backpack,
  FileText,
  Lightbulb,
  Video,
  Camera,
  Activity,
  Layers,
  Map,
  Share2,
} from 'lucide-react';

import { CitySearchCombobox, CityOption } from '@/components/common/CitySearchCombobox';

export interface CategoryOption {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
}

interface ExperienceCreateClientProps {
  cities: CityOption[];
  categories: CategoryOption[];
  locale: string;
  initialData?: any;
}

interface ItineraryStep {
  time?: string;
  title: string;
  title_id?: string;
  title_en?: string;
  durationMinutes: number;
  location?: string;
  description: string;
  description_id?: string;
  description_en?: string;
}

type ServiceType = 'PHYSICAL_TOUR' | 'DIGITAL_SERVICE' | 'CREATIVE_SESSION';

export function ExperienceCreateClient({
  cities,
  categories,
  locale,
  initialData,
}: ExperienceCreateClientProps) {
  const router = useRouter();
  const isId = locale === 'id';
  const isEdit = Boolean(initialData);

  // AI Copilot States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Form States - Block 1: Detail Inti & Dwibahasa
  const [titleId, setTitleId] = useState(initialData?.title_id || initialData?.title || '');
  const [titleEn, setTitleEn] = useState(initialData?.title_en || initialData?.title || '');
  const [categoryId, setCategoryId] = useState<number | ''>(
    initialData?.category_id || categories[0]?.id || 1
  );
  const [experienceTypeId, setExperienceTypeId] = useState<number | undefined>(
    initialData?.experience_type_id || undefined
  );
  const [serviceType, setServiceType] = useState<ServiceType>(
    initialData?.service_type || 'PHYSICAL_TOUR'
  );
  const [cityId, setCityId] = useState<number | ''>(
    initialData?.city_id ? Number(initialData.city_id) : (cities[0]?.id ? Number(cities[0].id) : '')
  );
  const [descriptionId, setDescriptionId] = useState(
    initialData?.description_id || initialData?.description || ''
  );
  const [descriptionEn, setDescriptionEn] = useState(
    initialData?.description_en || initialData?.description || ''
  );

  // Active language tab for title/description editing ('id' | 'en')
  const [activeLangTab, setActiveLangTab] = useState<'id' | 'en'>(isId ? 'id' : 'en');

  // Form States - Block 2: Logistik & Jadwal (Adaptif berdasarkan Archetype)
  const [durationHours, setDurationHours] = useState<number>(initialData?.duration_hours || 3);
  const [maxParticipants, setMaxParticipants] = useState<number>(initialData?.max_participants || 4);
  const [meetingPoint, setMeetingPoint] = useState(initialData?.meeting_point || '');
  const [meetingPointNotes, setMeetingPointNotes] = useState(initialData?.meeting_point_notes || '');
  const [consultationPlatform, setConsultationPlatform] = useState(
    initialData?.consultation_platform || 'Google Meet / Zoom / WhatsApp'
  );
  const [deliverables, setDeliverables] = useState<string[]>(
    Array.isArray(initialData?.deliverables) ? initialData.deliverables : []
  );
  const [newDeliverable, setNewDeliverable] = useState('');

  const [itinerary, setItinerary] = useState<ItineraryStep[]>(() => {
    if (Array.isArray(initialData?.itinerary) && initialData.itinerary.length > 0) {
      return initialData.itinerary;
    }
    return [
      {
        time: '09:00',
        title: isId ? 'Titik Kumpul & Pengenalan Singkat' : 'Meeting & Briefing',
        title_id: 'Titik Kumpul & Pengenalan Singkat',
        title_en: 'Meeting & Briefing',
        durationMinutes: 30,
        location: '',
        description: isId ? 'Menyapa peserta dan review rute petualangan.' : 'Meet guests and review tour route.',
        description_id: 'Menyapa peserta dan review rute petualangan.',
        description_en: 'Meet guests and review tour route.',
      },
      {
        time: '10:00',
        title: isId ? 'Eksplorasi Spot Utama & Kuliner Lokal' : 'Main Exploration & Tasting',
        title_id: 'Eksplorasi Spot Utama & Kuliner Lokal',
        title_en: 'Main Exploration & Tasting',
        durationMinutes: 120,
        location: '',
        description: isId ? 'Menjelajahi keindahan dan mencicipi sajian autentik.' : 'Explore highlights and taste authentic delights.',
        description_id: 'Menjelajahi keindahan dan mencicipi sajian autentik.',
        description_en: 'Explore highlights and taste authentic delights.',
      },
    ];
  });

  // Form States - Block 3: Harga Paket, Fasilitas & Perlengkapan
  const [price, setPrice] = useState<number>(
    initialData?.package_price ? Number(initialData.package_price) : 45
  );
  const [currency] = useState<'USD'>(initialData?.currency || 'USD');
  const [inclusions, setInclusions] = useState<string[]>(() => {
    if (Array.isArray(initialData?.included_items) && initialData.included_items.length > 0) {
      return initialData.included_items;
    }
    return [
      isId ? 'Pemandu lokal privat berpengalaman' : 'Private licensed local guide',
      isId ? 'Air mineral & snack pembuka' : 'Bottled water & local snack',
    ];
  });
  const [inclusionsEn, setInclusionsEn] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>(() => {
    if (Array.isArray(initialData?.excluded_items) && initialData.excluded_items.length > 0) {
      return initialData.excluded_items;
    }
    return [
      isId ? 'Transportasi dari/ke hotel' : 'Hotel pick-up & drop-off',
      isId ? 'Pengeluaran pribadi' : 'Personal expenses',
    ];
  });
  const [exclusionsEn, setExclusionsEn] = useState<string[]>([]);
  const [whatToBring, setWhatToBring] = useState<string[]>(() => {
    if (initialData?.requirements && typeof initialData.requirements === 'string') {
      return initialData.requirements.split('\n').filter(Boolean);
    }
    return [
      isId ? 'Sepatu jalan yang nyaman' : 'Comfortable walking shoes',
      isId ? 'Kamera atau smartphone terisi penuh' : 'Fully charged camera or smartphone',
    ];
  });
  const [whatToBringEn, setWhatToBringEn] = useState<string[]>([]);

  // Input tag temporary states
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newWhatToBring, setNewWhatToBring] = useState('');

  // Form States - Block 4: Media Galeri (ImageUploadDropzone clean filename)
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'draft' | 'published'>('published');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ slug: string; status: string; rewardXp?: number } | null>(null);

  // Helper untuk menentukan archetype berdasarkan categoryId yang dipilih
  const updateArchetypeFromCategory = (catId: number) => {
    const selectedCat = categories.find((c) => c.id === catId);
    const catName = selectedCat?.name.toLowerCase() || '';

    if (catId === 4 || catName.includes('plan')) {
      setServiceType('DIGITAL_SERVICE');
      if (!meetingPoint || meetingPoint.toLowerCase().includes('lobi') || meetingPoint.toLowerCase().includes('stasiun')) {
        setMeetingPoint('Konsultasi Online (Google Meet / Zoom / WhatsApp)');
      }
      if (deliverables.length === 0) {
        setDeliverables([
          'Dokumen Rencana Perjalanan PDF Interaktif',
          'Tautan Peta Kustom Google Maps dengan Pin Rekomendasi',
          'Daftar Estimasi Budget & Rekomendasi Kuliner Otentik',
        ]);
      }
    } else if (catId === 2 || catName.includes('photo')) {
      setServiceType('CREATIVE_SESSION');
      if (deliverables.length === 0) {
        setDeliverables([
          '50+ Foto Resolusi Tinggi Hasil Kurasi & Color Grading',
          'Tautan Galeri Online Pribadi (Aktif 30 Hari)',
          'Pengiriman File Digital dalam 3 Hari Kerja',
        ]);
      }
    } else {
      setServiceType('PHYSICAL_TOUR');
    }
  };

  // Quick Prompt Sample Suggestions untuk 4 Archetype
  const promptSuggestions = [
    {
      title: isId ? '🏮 Kuliner Malam & Gang Rahasia' : '🏮 Night Food & Alleys',
      prompt: isId
        ? 'Tur jalan kaki kuliner malam menyusuri gang tersembunyi bersejarah, mencicipi 4 jajanan legendaris, dan mendengar kisah lokal.'
        : 'Night street food walking tour through hidden historic alleys, tasting 4 legendary street foods with local stories.',
    },
    {
      title: isId ? '🗺️ Itinerary Kustom & Rencana Liburan' : '🗺️ Custom Itinerary Plan',
      prompt: isId
        ? 'Rancangan rencana perjalanan liburan 4 hari 3 malam kustom, lengkap dengan peta interaktif, rekomendasi kafe tersembunyi, dan panduan budget.'
        : 'Custom 4D3N personalized vacation itinerary with interactive map pins, secret cafes, and transit budget breakdown.',
    },
    {
      title: isId ? '📸 Sesi Foto Liburan & Content Creator' : '📸 Vacation Photoshoot',
      prompt: isId
        ? 'Sesi foto liburan privat di spot estetis kota, foto portrait dan candid natural, cocok untuk pasangan atau solo traveler.'
        : 'Private aesthetic photoshoot around iconic city landmarks, candid & portrait styling for solo traveler or couples.',
    },
    {
      title: isId ? '🧘 Sunrise Yoga & Mindful Breathing' : '🧘 Sunrise Yoga Session',
      prompt: isId
        ? 'Sesi yoga dan peregangan pagi di alam terbuka saat matahari terbit, dipandu instruktur berpengalaman dengan teh herbal lokal.'
        : 'Sunrise outdoor yoga flow and mindful breathing session guided by a certified instructor with fresh herbal tea.',
    },
  ];

  // Handler: Generate Content with AI Copilot
  const handleGenerateAi = async (customPrompt?: string) => {
    const textToUse = customPrompt || aiPrompt;
    if (!textToUse || textToUse.trim().length < 5) {
      setErrorMessage(
        isId
          ? 'Silakan ceritakan ide tur Anda minimal 5 karakter untuk AI Copilot.'
          : 'Please describe your tour idea in at least 5 characters for the AI Copilot.'
      );
      return;
    }

    setErrorMessage(null);
    setAiSuccessMessage(null);
    setIsGeneratingAi(true);

    try {
      const selectedCity = cities.find((c) => Number(c.id) === Number(cityId));
      const cityName = selectedCity?.name || (isId ? 'Indonesia' : 'Indonesia');

      const res = await fetch('/api/ai/generate-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse.trim(),
          cityName,
          basePrice: price || 45,
          currency: 'USD',
          categoryId: categoryId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (isId ? 'Gagal menghubungi AI Copilot.' : 'Failed to contact AI Copilot.'));
      }

      const d = json.data;

      // Populate Form Fields
      if (d.title_id) setTitleId(d.title_id);
      if (d.title_en) setTitleEn(d.title_en);
      if (d.category_id && categories.some((c) => c.id === d.category_id)) {
        setCategoryId(d.category_id);
      }
      if (d.experience_type_id) {
        setExperienceTypeId(d.experience_type_id);
      }
      if (d.service_type) {
        setServiceType(d.service_type);
      }
      if (d.duration_hours) setDurationHours(d.duration_hours);
      if (d.max_participants) setMaxParticipants(d.max_participants);
      if (d.description_id) setDescriptionId(d.description_id);
      if (d.description_en) setDescriptionEn(d.description_en);
      if (d.meeting_point) setMeetingPoint(d.meeting_point);
      if (d.meeting_point_notes) setMeetingPointNotes(d.meeting_point_notes);

      // Deliverables
      if (Array.isArray(d.deliverables) && d.deliverables.length > 0) {
        setDeliverables(d.deliverables);
      }

      // Itinerary
      if (Array.isArray(d.itinerary) && d.itinerary.length > 0) {
        const formattedItinerary: ItineraryStep[] = d.itinerary.map((step: any, idx: number) => ({
          time: step.time || (d.service_type === 'DIGITAL_SERVICE' ? `Tahap ${idx + 1}` : `0${9 + idx}:00`),
          title: (isId ? step.title_id : step.title_en) || step.title_id || step.title_en || `Langkah ${idx + 1}`,
          title_id: step.title_id || '',
          title_en: step.title_en || '',
          durationMinutes: step.durationMinutes || (d.service_type === 'DIGITAL_SERVICE' ? 60 : 45),
          location: step.location || step.time || '',
          description: (isId ? step.description_id : step.description_en) || step.description_id || step.description_en || '',
          description_id: step.description_id || '',
          description_en: step.description_en || '',
        }));
        setItinerary(formattedItinerary);
      }

      // Inclusions & Exclusions & What to Bring
      if (Array.isArray(d.inclusions_id) && d.inclusions_id.length > 0) {
        setInclusions(d.inclusions_id);
      }
      if (Array.isArray(d.inclusions_en) && d.inclusions_en.length > 0) {
        setInclusionsEn(d.inclusions_en);
      }
      if (Array.isArray(d.exclusions_id) && d.exclusions_id.length > 0) {
        setExclusions(d.exclusions_id);
      }
      if (Array.isArray(d.exclusions_en) && d.exclusions_en.length > 0) {
        setExclusionsEn(d.exclusions_en);
      }
      if (Array.isArray(d.what_to_bring_id) && d.what_to_bring_id.length > 0) {
        setWhatToBring(d.what_to_bring_id);
      }
      if (Array.isArray(d.what_to_bring_en) && d.what_to_bring_en.length > 0) {
        setWhatToBringEn(d.what_to_bring_en);
      }

      const archetypeLabel =
        d.service_type === 'DIGITAL_SERVICE'
          ? 'Trip Planner (Digital Service)'
          : d.service_type === 'CREATIVE_SESSION'
          ? 'Photographer (Creative Session)'
          : 'Physical Tour (Guide/Wellness)';

      setAiSuccessMessage(
        isId
          ? `✨ AI berhasil mendeteksi archetype "${archetypeLabel}" dan merancang seluruh detail tur secara adaptif!`
          : `✨ AI successfully detected archetype "${archetypeLabel}" and crafted all tour details adaptively!`
      );
    } catch (err: any) {
      console.error('AI generate error:', err);
      setErrorMessage(err?.message || (isId ? 'Gagal merancang pengalaman dengan AI.' : 'Failed to generate experience with AI.'));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Itinerary helpers
  const handleAddItineraryStep = () => {
    const isDigital = serviceType === 'DIGITAL_SERVICE';
    setItinerary((prev) => [
      ...prev,
      {
        time: isDigital ? `Tahap ${prev.length + 1}` : `1${prev.length}:00`,
        title: isDigital
          ? `Tahap Proses ${prev.length + 1}`
          : isId
          ? `Rute Kunjungan ${prev.length + 1}`
          : `Tour Stop ${prev.length + 1}`,
        title_id: isDigital ? `Tahap Proses ${prev.length + 1}` : `Rute Kunjungan ${prev.length + 1}`,
        title_en: isDigital ? `Process Phase ${prev.length + 1}` : `Tour Stop ${prev.length + 1}`,
        durationMinutes: isDigital ? 60 : 45,
        location: '',
        description: '',
        description_id: '',
        description_en: '',
      },
    ]);
  };

  const handleRemoveItineraryStep = (index: number) => {
    setItinerary((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItinerary = (
    index: number,
    field: keyof ItineraryStep,
    value: string | number
  ) => {
    setItinerary((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    );
  };

  // Deliverables helpers
  const handleAddDeliverable = () => {
    if (newDeliverable.trim()) {
      setDeliverables((prev) => [...prev, newDeliverable.trim()]);
      setNewDeliverable('');
    }
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  // Inclusion / Exclusion / WhatToBring helpers
  const handleAddInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions((prev) => [...prev, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions((prev) => [...prev, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const handleRemoveExclusion = (index: number) => {
    setExclusions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddWhatToBring = () => {
    if (newWhatToBring.trim()) {
      setWhatToBring((prev) => [...prev, newWhatToBring.trim()]);
      setNewWhatToBring('');
    }
  };

  const handleRemoveWhatToBring = (index: number) => {
    setWhatToBring((prev) => prev.filter((_, i) => i !== index));
  };

  // Submission Handler (Dual: Draft or Publish)
  const handleSubmitAction = async (targetStatus: 'draft' | 'published') => {
    setErrorMessage(null);
    setSubmitMode(targetStatus);

    const mainTitle = (titleId || titleEn).trim();
    const mainDesc = (descriptionId || descriptionEn).trim();

    if (targetStatus === 'published') {
      if (!mainTitle || mainTitle.length < 10) {
        setErrorMessage(isId ? 'Judul tur minimal 10 karakter untuk dipublikasikan.' : 'Tour title must be at least 10 characters.');
        return;
      }
      if (!categoryId || !cityId) {
        setErrorMessage(isId ? 'Silakan pilih kategori dan kota destinasi tur.' : 'Please select both category and destination city.');
        return;
      }
      if (!mainDesc || mainDesc.length < 20) {
        setErrorMessage(isId ? 'Deskripsi tur minimal 20 karakter agar jelas bagi wisatawan.' : 'Tour description must be at least 20 characters.');
        return;
      }
      if (!meetingPoint.trim()) {
        setErrorMessage(isId ? 'Titik kumpul atau platform konsultasi wajib diisi.' : 'Meeting point or consultation platform is required.');
        return;
      }
      if (price <= 0) {
        setErrorMessage(isId ? 'Tarif paket tur harus lebih dari 0.' : 'Package price must be greater than 0.');
        return;
      }
    } else {
      // Draft validation (minimal 5 karakter)
      if (!mainTitle || mainTitle.length < 5) {
        setErrorMessage(isId ? 'Judul tur minimal 5 karakter untuk menyimpan draf.' : 'Tour title must be at least 5 characters to save draft.');
        return;
      }
      if (!categoryId || !cityId) {
        setErrorMessage(isId ? 'Silakan pilih kategori dan kota destinasi tur.' : 'Please select category and destination city.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const mappedItinerary: CreateExperienceItineraryItem[] = itinerary.map((item, idx) => ({
        time: item.time || (serviceType === 'DIGITAL_SERVICE' ? `Tahap ${idx + 1}` : `0${9 + idx}:00`),
        title: item.title || item.title_id || item.title_en || `Stop ${idx + 1}`,
        title_id: item.title_id || item.title || undefined,
        title_en: item.title_en || item.title || undefined,
        description: item.description || item.description_id || item.description_en || undefined,
        description_id: item.description_id || undefined,
        description_en: item.description_en || undefined,
        durationMinutes: item.durationMinutes || 45,
        location: item.location || undefined,
      }));

      let res;
      if (isEdit && initialData?.id) {
        res = await updateExperience(initialData.id, {
          categoryId: Number(categoryId),
          experienceTypeId: experienceTypeId,
          serviceType: serviceType,
          cityId: Number(cityId),
          durationHours: Number(durationHours),
          maxParticipants: Number(maxParticipants),
          price: Number(price),
          currency,
          description: mainDesc,
          description_id: descriptionId.trim() || undefined,
          description_en: descriptionEn.trim() || undefined,
          meetingPoint: meetingPoint.trim(),
          meetingPointNotes: meetingPointNotes.trim() || undefined,
          consultationPlatform: serviceType === 'DIGITAL_SERVICE' ? consultationPlatform : undefined,
          deliverables: deliverables.filter(Boolean),
          coverImageUrl: galleryImages[0] || undefined,
          galleryImages: galleryImages.filter(Boolean),
          inclusions: inclusions.filter(Boolean),
          inclusions_id: inclusions.filter(Boolean),
          inclusions_en: inclusionsEn.filter(Boolean),
          exclusions: exclusions.filter(Boolean),
          exclusions_id: exclusions.filter(Boolean),
          exclusions_en: exclusionsEn.filter(Boolean),
          what_to_bring: whatToBring.filter(Boolean),
          what_to_bring_id: whatToBring.filter(Boolean),
          what_to_bring_en: whatToBringEn.filter(Boolean),
          itinerary: mappedItinerary,
          status: targetStatus,
        });
      } else {
        res = await createExperience({
          title: mainTitle,
          title_id: titleId.trim() || undefined,
          title_en: titleEn.trim() || undefined,
          categoryId: Number(categoryId),
          experienceTypeId: experienceTypeId,
          serviceType: serviceType,
          cityId: Number(cityId),
          durationHours: Number(durationHours),
          maxParticipants: Number(maxParticipants),
          price: Number(price),
          currency,
          description: mainDesc,
          description_id: descriptionId.trim() || undefined,
          description_en: descriptionEn.trim() || undefined,
          meetingPoint: meetingPoint.trim(),
          meetingPointNotes: meetingPointNotes.trim() || undefined,
          consultationPlatform: serviceType === 'DIGITAL_SERVICE' ? consultationPlatform : undefined,
          deliverables: deliverables.filter(Boolean),
          coverImageUrl: galleryImages[0] || undefined,
          galleryImages: galleryImages.filter(Boolean),
          inclusions: inclusions.filter(Boolean),
          inclusions_id: inclusions.filter(Boolean),
          inclusions_en: inclusionsEn.filter(Boolean),
          exclusions: exclusions.filter(Boolean),
          exclusions_id: exclusions.filter(Boolean),
          exclusions_en: exclusionsEn.filter(Boolean),
          what_to_bring: whatToBring.filter(Boolean),
          what_to_bring_id: whatToBring.filter(Boolean),
          what_to_bring_en: whatToBringEn.filter(Boolean),
          itinerary: mappedItinerary,
          status: targetStatus,
        });
      }

      if (!res.success) {
        setErrorMessage(res.error || (isId ? 'Gagal menyimpan tur.' : 'Failed to save experience.'));
        return;
      }

      setCreatedResult({
        slug: res.slug || 'success',
        status: targetStatus,
        rewardXp: 80,
      });
      router.refresh();
    } catch (err: any) {
      console.error('Submit experience error:', err);
      setErrorMessage(err?.message || (isId ? 'Terjadi kesalahan sistem saat menyimpan.' : 'Network error occurred.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper flags
  const isDigital = serviceType === 'DIGITAL_SERVICE';
  const isCreative = serviceType === 'CREATIVE_SESSION';

  // Success view
  if (createdResult) {
    const isPublished = createdResult.status === 'published';
    return (
      <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-6 sm:p-12 border border-emerald-100 shadow-xl shadow-emerald-500/5 text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isPublished
                ? isId
                  ? 'Pengalaman Tur Berhasil Diterbitkan! (+80 XP)'
                  : 'Tour Experience Published! (+80 XP)'
                : isId
                ? 'Draf Pengalaman Tur Berhasil Disimpan!'
                : 'Tour Experience Draft Saved!'}
            </span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {titleId || titleEn || 'Pengalaman Tur Baru'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            {isPublished
              ? isId
                ? 'Tur baru Anda kini siap menerima pesanan dari traveler seluruh dunia. Wisatawan akan memesan secara utuh sebagai satu paket grup privat.'
                : 'Your new tour package is now live and ready for bookings from worldwide travelers as a private group package.'
              : isId
              ? 'Draf tersimpan dengan aman di akun Host Anda. Anda dapat kembali melengkapi atau menerbitkannya kapan saja.'
              : 'Your draft has been saved safely in your Host account. You can review or publish it whenever you are ready.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href={`/${locale}/dashboard`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition min-h-[44px]"
          >
            <span>{isId ? 'Ke Dashboard Host' : 'Go to Host Dashboard'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          {isPublished && (
            <Link
              href={`/${locale}/experiences/${createdResult.slug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm transition shadow-sm shadow-brand-500/20 min-h-[44px]"
            >
              <Compass className="w-4 h-4" />
              <span>{isId ? 'Lihat Halaman Publik Tur' : 'View Public Tour Page'}</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* 1. Header Bar: Tombol Kembali & Info Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-2xs transition self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>{isId ? 'Host Studio: Rancang Pengalaman Baru' : 'Host Studio: Create New Tour'}</span>
        </div>
      </div>

      {/* 2. Kartu Insentif Host (+80 XP) */}
      <RewardIncentiveCard
        xp={80}
        ltp={10}
        locale={locale}
        actionTitleId="Apresiasi Publikasi Tur Baru: +80 XP Reputasi"
        actionTitleEn="New Tour Publishing Reward: +80 XP Reputation"
      />

      {/* 3. SECTION 0: AI QUICK TRIGGER & FAST SETUP (FEATURED TOP CARD) */}
      <div className="w-full bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10 border border-indigo-700/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>{isId ? 'AI Adaptive Experience Copilot' : 'AI Adaptive Experience Copilot'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 pt-1">
              <span>{isId ? 'Rancang Tur Otomatis dengan AI' : 'Design Tour Automatically with AI'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
              {isId
                ? 'Ceritakan ide layanan atau tur Anda dalam 1-2 kalimat. AI akan otomatis mendeteksi apakah ini Tur Fisik, Trip Planner Digital, atau Sesi Foto Kreatif, dan merancang seluruh detailnya.'
                : 'Share your tour or service idea. AI detects if it is a Physical Tour, Digital Trip Plan, or Creative Photoshoot, and crafts all details adaptively.'}
            </p>
          </div>
        </div>

        {/* Baris Atas: Fast Setup (Kota & Harga Cepat) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
              {isId ? 'Kota Operasional' : 'Destination City'}
            </label>
            <CitySearchCombobox
              cities={cities}
              value={cityId}
              onChange={(val) => setCityId(val)}
              locale={locale}
              placeholder={isId ? 'Pilih kota...' : 'Select city...'}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
              {isId ? 'Perkiraan Harga Paket (Flat USD)' : 'Base Package Price (Flat USD)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300 font-bold text-sm">$</span>
              <input
                type="number"
                min={5}
                step={5}
                value={price}
                onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))}
                className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Textarea AI Prompt */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                isId
                  ? 'Contoh: Tur kuliner malam jalan kaki di gang-gang bersejarah Pasar Baru, icip 4 jajanan lokal legendaris... ATAU: Jasa itinerary kustom 4 hari 3 malam di Tokyo dengan peta Google Maps...'
                  : 'E.g., Night walking food tour in secret historic alleys... OR: Custom 4D3N itinerary plan in Tokyo with interactive Google Maps...'
              }
              className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/15 transition resize-none"
            />
          </div>

          {/* Quick Idea Suggestions */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-200">
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>{isId ? 'Ide Inspirasi Cepat (Klik untuk coba):' : 'Quick Inspiration Ideas (Click to try):'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiPrompt(s.prompt);
                    handleGenerateAi(s.prompt);
                  }}
                  disabled={isGeneratingAi}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-purple-100 font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button Generate */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-purple-200/60">
              {isId
                ? 'Model AI: Gemini 3.8 Flash • Otomatis mendeteksi Archetype & menyesuaikan form di bawah.'
                : 'AI Model: Gemini 3.8 Flash • Automatically detects Archetype and adapts form.'}
            </p>
            <button
              type="button"
              onClick={() => handleGenerateAi()}
              disabled={isGeneratingAi || !aiPrompt.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{isId ? 'AI Sedang Menganalisis & Merancang...' : 'AI is Analyzing & Crafting...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isId ? '🪄 Rancang Pengalaman dengan AI' : '🪄 Craft Experience with AI'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Success Notification */}
        {aiSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="font-medium">{aiSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* 4. FORM CARD UTAMA (ADAPTIF BERDASARKAN ARCHETYPE) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-10">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <p className="flex-1 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Archetype Indicator Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
              isDigital
                ? 'bg-blue-600'
                : isCreative
                ? 'bg-purple-600'
                : 'bg-emerald-600'
            }`}>
              {isDigital ? <Video className="w-4 h-4" /> : isCreative ? <Camera className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isId ? 'Archetype Mode Layanan' : 'Active Service Mode'}
              </span>
              <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                {isDigital
                  ? '💻 Trip Planner (Digital Service & Deliverables)'
                  : isCreative
                  ? '📸 Photographer (Creative Session)'
                  : '🧭 Physical Tour & Guiding (Local Guide / Combo / Wellness)'}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {isDigital
              ? isId ? 'Form disesuaikan: Meeting point digital & dokumen rute' : 'Adapted: Digital meeting point & documents'
              : isId ? 'Form disesuaikan: Meeting point fisik & itinerary jam' : 'Adapted: Physical meeting point & hourly stops'}
          </span>
        </div>

        {/* ================= BLOK 1: DETAIL INTI & DWIBAHASA ================= */}
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-600" />
                <span>{isId ? '1. Detail Inti & Kategori Layanan (Dwibahasa)' : '1. Core Details & Service Category (Bilingual)'}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isId
                  ? 'Sajikan layanan Anda dalam Bahasa Indonesia dan English agar menarik wisatawan domestik maupun internasional.'
                  : 'Provide details in Indonesian and English to attract both domestic and international travelers.'}
              </p>
            </div>

            {/* Language Switcher Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveLangTab('id')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeLangTab === 'id'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>🇮🇩 Bahasa Indonesia</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab('en')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeLangTab === 'en'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>🇬🇧 English</span>
              </button>
            </div>
          </div>

          {/* Input Judul Tur (Bilingual Controlled by Tab) */}
          {activeLangTab === 'id' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {isId ? 'Judul Pengalaman / Layanan (Bahasa Indonesia)' : 'Experience Title (Indonesian)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titleId}
                onChange={(e) => setTitleId(e.target.value)}
                disabled={isEdit}
                readOnly={isEdit}
                placeholder="Contoh: Berburu Street Food Otentik & Hidden Alley Malam di Pasar Baru"
                className={`w-full px-4 py-3.5 border rounded-xl text-sm sm:text-base focus:outline-none min-h-[44px] transition ${
                  isEdit
                    ? 'bg-slate-100/90 border-slate-300 text-slate-500 cursor-not-allowed select-none'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
              />
              {isEdit && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/90 rounded-xl px-3 py-2 mt-2 flex items-center gap-1.5 font-medium">
                  <span>🔒</span>
                  <span>Judul tidak dapat diubah setelah diterbitkan untuk menjaga validitas tautan SEO. (Title cannot be changed to protect SEO links).</span>
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {isId ? 'Judul Pengalaman / Layanan (English)' : 'Experience Title (English)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                disabled={isEdit}
                readOnly={isEdit}
                placeholder="E.g., Authentic Night Street Food & Hidden Alleys in Pasar Baru"
                className={`w-full px-4 py-3.5 border rounded-xl text-sm sm:text-base focus:outline-none min-h-[44px] transition ${
                  isEdit
                    ? 'bg-slate-100/90 border-slate-300 text-slate-500 cursor-not-allowed select-none'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
              />
              {isEdit && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/90 rounded-xl px-3 py-2 mt-2 flex items-center gap-1.5 font-medium">
                  <span>🔒</span>
                  <span>Judul tidak dapat diubah setelah diterbitkan untuk menjaga validitas tautan SEO. (Title cannot be changed to protect SEO links).</span>
                </p>
              )}
            </div>
          )}

          {/* Kategori & Kota Destinasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori Tur (Host Category) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {isId ? 'Kategori Host (Archetype)' : 'Host Category (Archetype)'} <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  const newId = Number(e.target.value);
                  setCategoryId(newId);
                  updateArchetypeFromCategory(newId);
                }}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none min-h-[44px]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Kota Destinasi Tur */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {isId ? 'Kota Destinasi / Cakupan' : 'City Destination / Coverage'} <span className="text-red-500">*</span>
              </label>
              <CitySearchCombobox
                cities={cities}
                value={cityId}
                onChange={(val) => setCityId(val)}
                locale={locale}
                placeholder={isId ? 'Pilih kota destinasi tur...' : 'Select tour destination city...'}
              />
            </div>
          </div>

          {/* Deskripsi Tur (Bilingual Controlled by Tab with Markdown Editor) */}
          <div className={activeLangTab === 'id' ? 'block' : 'hidden'}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isId ? 'Deskripsi Lengkap Tur (Bahasa Indonesia)' : 'Tour Description (Indonesian)'}
              </label>
              <span className={`text-[11px] font-medium ${descriptionId.replace(/<[^>]*>/g, '').trim().length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {descriptionId.replace(/<[^>]*>/g, '').trim().length}/20 {isId ? 'karakter minimal' : 'min characters'}
              </span>
            </div>
            <MarkdownEditor
              value={descriptionId}
              onChange={(val) => setDescriptionId(val)}
              placeholder={isId ? 'Jelaskan pengalaman yang akan didapat tamu, cerita tempat, dan keunikan tur...' : 'Explain the tour experience, local culture, and highlights in Indonesian...'}
              folder="experiences"
              minHeight="280px"
            />
          </div>

          <div className={activeLangTab === 'en' ? 'block' : 'hidden'}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isId ? 'Deskripsi Lengkap Tur (English)' : 'Tour Description (English)'}
              </label>
              <span className={`text-[11px] font-medium ${descriptionEn.replace(/<[^>]*>/g, '').trim().length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {descriptionEn.replace(/<[^>]*>/g, '').trim().length}/20 {isId ? 'karakter minimal' : 'min characters'}
              </span>
            </div>
            <MarkdownEditor
              value={descriptionEn}
              onChange={(val) => setDescriptionEn(val)}
              placeholder="Describe what guests will experience, special value delivered, and why this package is special..."
              folder="experiences"
              minHeight="280px"
            />
          </div>
        </div>

        {/* ================= BLOK 2: LOGISTIK ADAPTIF & JADWAL ================= */}
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              <span>
                {isDigital
                  ? isId
                    ? '2. Metode Konsultasi Digital & Proses Perancangan'
                    : '2. Digital Consultation & Document Process'
                  : isId
                  ? '2. Logistik, Kuota Rombongan & Titik Kumpul'
                  : '2. Logistics, Group Capacity & Meeting Point'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isDigital
                ? isId
                  ? 'Atur platform konsultasi online, tahapan pengerjaan dokumen, dan file deliverables yang akan diterima traveler.'
                  : 'Configure digital consultation channels, design milestones, and deliverables traveler receives.'
                : isId
                ? 'Atur durasi perjalanan, batas rombongan per paket privat, dan titik kumpul yang mudah ditemukan.'
                : 'Set tour duration, maximum private party size, and accessible meeting spot.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Durasi Jam / Sesi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {isDigital
                  ? isId
                    ? 'Durasi Sesi Konsultasi (Jam)'
                    : 'Consultation Session Duration (Hours)'
                  : isId
                  ? 'Durasi Tur (Jam)'
                  : 'Tour Duration (Hours)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={durationHours}
                  onChange={(e) => setDurationHours(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[44px]"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Kuota Maksimal Tamu per Paket */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {isDigital
                  ? isId
                    ? 'Batas Peserta Konsultasi (Orang)'
                    : 'Max Participants in Consultation'
                  : isId
                  ? 'Kapasitas Rombongan (Maks. Orang per Paket)'
                  : 'Group Capacity (Max Guests per Package)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[44px]"
                />
                <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isId ? 'Tarif flat berlaku untuk 1 rombongan privat hingga kapasitas ini.' : 'Flat package rate applies up to this limit.'}
              </p>
            </div>
          </div>

          {/* TITIK KUMPUL / PLATFORM KONSULTASI (ADAPTIF) */}
          {isDigital ? (
            /* Mode DIGITAL SERVICE: Platform Konsultasi Online */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isId ? 'Platform Konsultasi Online' : 'Online Consultation Platform'} <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="Contoh: Google Meet / Zoom / WhatsApp Video Call"
                  className="w-full px-4 py-3.5 bg-white border border-blue-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">
                  {isId ? 'Panduan Pengiriman Tautan Akses' : 'Link & Access Instructions'}
                </label>
                <input
                  type="text"
                  value={meetingPointNotes}
                  onChange={(e) => setMeetingPointNotes(e.target.value)}
                  placeholder={
                    isId
                      ? 'Contoh: Tautan ruang video call dikirimkan via chat Locallytrip setelah booking.'
                      : 'E.g., Meeting link will be shared via Locallytrip chat upon booking.'
                  }
                  className="w-full px-4 py-3.5 bg-white border border-blue-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[44px]"
                />
              </div>
            </div>
          ) : (
            /* Mode PHYSICAL TOUR & CREATIVE SESSION: Titik Kumpul Fisik */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>{isId ? 'Titik Kumpul (Meeting Point)' : 'Meeting Point'} <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder={
                    isId
                      ? 'Contoh: Depan Pintu Masuk Stasiun MRT Bundaran HI'
                      : 'E.g., In front of MRT Station Bundaran HI Gate 2'
                  }
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isId ? 'Panduan / Catatan Patokan Host' : 'Landmark & Spotting Notes'}
                </label>
                <input
                  type="text"
                  value={meetingPointNotes}
                  onChange={(e) => setMeetingPointNotes(e.target.value)}
                  placeholder={
                    isId
                      ? 'Contoh: Host mengenakan topi Locallytrip dekat kafe'
                      : 'E.g., Host wearing Locallytrip badge near coffee shop'
                  }
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[44px]"
                />
              </div>
            </div>
          )}

          {/* DELIVERABLES SPESIFIK (JIKA TRIP PLANNER ATAU PHOTOGRAPHER) */}
          {(isDigital || isCreative) && (
            <div className="space-y-3 p-4 rounded-2xl bg-purple-50/40 border border-purple-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {isDigital
                    ? isId ? 'Format Berkas & Keluaran Dokumen (Deliverables)' : 'Document Deliverables & Formats'
                    : isId ? 'Spesifikasi Hasil Foto (Photo Deliverables)' : 'Photo Deliverables & Formats'}
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDeliverable();
                    }
                  }}
                  placeholder={
                    isDigital
                      ? isId ? 'Tambah deliverable: misal Dokumen PDF, Tautan Google Maps, Notion...' : 'Add deliverable: e.g. PDF Guide, Google Maps Link...'
                      : isId ? 'Tambah deliverable: misal 50 Foto Edit Warna, Cloud Gallery...' : 'Add deliverable: e.g. 50 Edited Photos, Cloud Link...'
                  }
                  className="flex-1 px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {deliverables.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-purple-200 text-xs font-semibold text-purple-900 shadow-2xs"
                  >
                    <span>✓ {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(idx)}
                      className="text-purple-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ITINERARY TIMELINE (ADAPTIF: TAHAPAN DOKUMEN ATAU SPOT FISIK) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-600" />
                <span>
                  {isDigital
                    ? isId ? 'Tahapan Proses Perancangan & Revisi' : 'Design & Revision Process Milestones'
                    : isId ? 'Rute & Garis Waktu Perjalanan (Timeline)' : 'Itinerary Timeline & Stops'}
                </span>
              </label>
              <button
                type="button"
                onClick={handleAddItineraryStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isDigital ? (isId ? 'Tambah Tahap' : 'Add Phase') : (isId ? 'Tambah Rute' : 'Add Stop')}</span>
              </button>
            </div>

            <div className="space-y-3">
              {itinerary.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-start"
                >
                  <span className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-8">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateItinerary(idx, 'title', e.target.value)}
                          placeholder={
                            isDigital
                              ? isId ? 'Nama tahapan proses (misal: Sesi Konsultasi Profil)' : 'Phase title (e.g. Profiling Session)'
                              : isId ? 'Nama aktivitas / spot kunjungan' : 'Activity or spot title'
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div className="sm:col-span-4 flex gap-2">
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={step.durationMinutes}
                          onChange={(e) =>
                            handleUpdateItinerary(idx, 'durationMinutes', Number(e.target.value))
                          }
                          placeholder={isId ? 'Menit' : 'Minutes'}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <span className="text-xs text-slate-400 self-center shrink-0">menit</span>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => handleUpdateItinerary(idx, 'description', e.target.value)}
                        placeholder={
                          isDigital
                            ? isId ? 'Rincian apa yang dikerjakan / didiskusikan pada tahapan ini...' : 'What is discussed or produced in this phase...'
                            : isId ? 'Keterangan singkat aktivitas pada spot ini...' : 'Short description of activity at this stop...'
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  {itinerary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItineraryStep(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 transition cursor-pointer shrink-0"
                      title={isId ? 'Hapus' : 'Remove'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= BLOK 3: HARGA PAKET, FASILITAS & MEDIA ================= */}
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>{isId ? '3. Penetapan Harga Paket, Fasilitas & Foto' : '3. Package Pricing, Inclusions & Media'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isId
                ? 'Tentukan tarif flat per paket tur untuk satu rombongan tamu, serta apa saja yang mereka dapatkan.'
                : 'Set your flat private tour package rate and list what is included for the group.'}
            </p>
          </div>

          {/* Pricing Input Highlighted */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white border border-amber-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-amber-900">
                  {isId
                    ? 'Tarif Per Paket Layanan (Bukan Per Orang)'
                    : 'Flat Tour Package Price (Not Per Person)'}
                </label>
                <p className="text-xs text-amber-700 mt-0.5">
                  {isId
                    ? 'Traveler memesan sesi tur privat ini secara flat untuk rombongannya (hingga ' + maxParticipants + ' orang).'
                    : 'Guests book this entire private tour session flat for their group (up to ' + maxParticipants + ' guests).'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={price}
                    onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))}
                    className="w-36 pl-8 pr-3 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-900 font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                  />
                </div>
                <span className="text-xs font-bold text-slate-600">USD / paket</span>
              </div>
            </div>
          </div>

          {/* Inclusions & Exclusions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Termasuk (Inclusions) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isId ? 'Sudah Termasuk (Inclusions)' : 'What is Included'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInclusion();
                    }
                  }}
                  placeholder={isId ? 'Tambah fasilitas termasuk...' : 'Add included item...'}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddInclusion}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-2">
                {inclusions.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclusion(idx)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tidak Termasuk (Exclusions) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isId ? 'Tidak Termasuk (Exclusions)' : 'What is NOT Included'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExclusion();
                    }
                  }}
                  placeholder={isId ? 'Tambah hal tidak termasuk...' : 'Add excluded item...'}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddExclusion}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-2">
                {exclusions.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExclusion(idx)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Perlengkapan Yang Perlu Dibawa (What to Bring - Khusus Tour Fisik & Sesi Kreatif) */}
          {!isDigital && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Backpack className="w-3.5 h-3.5 text-brand-600" />
                <span>{isId ? 'Perlengkapan Yang Perlu Dibawa Tamu (What to Bring)' : 'What Guests Should Bring'}</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWhatToBring}
                  onChange={(e) => setNewWhatToBring(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddWhatToBring();
                    }
                  }}
                  placeholder={isId ? 'Contoh: Sepatu nyaman, jaket, kamera...' : 'E.g., Walking shoes, jacket, camera...'}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddWhatToBring}
                  className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {whatToBring.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhatToBring(idx)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unggah Galeri Foto Tur via ImageUploadDropzone (Clean Filename Media) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <ImageUploadDropzone
              value={galleryImages}
              onChange={(val) => {
                const arr = Array.isArray(val) ? val : val ? [val] : [];
                setGalleryImages(arr);
              }}
              folder="experiences"
              multiple={true}
              maxFiles={5}
              label={isId ? 'Galeri Foto Pengalaman Tur (Clean Filename Media)' : 'Tour Experience Photo Gallery (Clean Filename)'}
              description={
                isId
                  ? 'Unggah hingga 5 foto otentik (JPG, PNG, WebP). Kompresi otomatis WebP (maks 1200x800 px) diterapkan sebelum upload dan foto pertama menjadi sampul utama.'
                  : 'Upload up to 5 authentic photos (JPG, PNG, WebP). Auto-compressed to WebP (max 1200x800 px) before upload, first photo serves as cover.'
              }
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* ================= BLOK 4: TOMBOL AKSI GANDA (DRAF & TERBITKAN) ================= */}
        <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <Link
            href={`/${locale}/dashboard`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isId ? 'Batal' : 'Cancel'}</span>
          </Link>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            {/* Tombol Simpan Draf */}
            <button
              type="button"
              onClick={() => handleSubmitAction('draft')}
              disabled={isSubmitting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition shadow-2xs min-h-[44px] cursor-pointer ${
                isSubmitting && submitMode === 'draft' ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {isSubmitting && submitMode === 'draft' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  <span>{isId ? 'Menyimpan Draf...' : 'Saving Draft...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>{isId ? 'Simpan Draf' : 'Save Draft'}</span>
                </>
              )}
            </button>

            {/* Tombol Terbitkan Pengalaman Tur */}
            <button
              type="button"
              onClick={() => handleSubmitAction('published')}
              disabled={isSubmitting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm transition shadow-lg shadow-brand-500/25 min-h-[44px] cursor-pointer ${
                isSubmitting && submitMode === 'published' ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {isSubmitting && submitMode === 'published' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isId ? (isEdit ? 'Menyimpan Perubahan...' : 'Menerbitkan Pengalaman...') : (isEdit ? 'Saving Changes...' : 'Publishing Experience...')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEdit ? (isId ? 'Simpan Perubahan' : 'Update / Save Changes') : (isId ? 'Terbitkan Pengalaman Tur (+80 XP)' : 'Publish Tour Experience (+80 XP)')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
