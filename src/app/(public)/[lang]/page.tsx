import React from 'react';
import { getActiveExperiences } from '@/actions/experiences';
import { getDictionary } from '@/lib/getDictionary';
import { Locale } from '@/lib/i18n';
import { ExperienceGrid } from '@/components/marketplace/ExperienceGrid';
import { HeroSection } from '@/components/marketplace/HeroSection';
import { PopularDestinations } from '@/components/marketplace/PopularDestinations';
import { LocalGuidesSection, VerifiedGuideItem } from '@/components/marketplace/LocalGuidesSection';
import { HomeFaq } from '@/components/marketplace/HomeFaq';
import { CommunityStats } from '@/components/community/CommunityStats';
import { MobileAppPreview } from '@/components/marketplace/MobileAppPreview';
import { UgcTranslateButton } from '@/components/community/UgcTranslateButton';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
  Compass,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Coins,
  MessageCircle,
  Wand2,
  MapPin,
  Calendar,
  MessageSquare,
  Sparkles,
  Clock,
  CheckCircle2,
  Lock,
  Building2,
} from 'lucide-react';

interface MarketplacePageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    q?: string;
    cat?: string;
    date?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function MarketplacePage({
  params,
  searchParams,
}: MarketplacePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const locale = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;
  const searchQuery = resolvedSearchParams.q || '';
  const selectedCategory = resolvedSearchParams.cat || '';

  // Mengambil kamus i18n
  const dict = await getDictionary(locale);

  // Mengambil data experiences aktif dari Server Action dengan filter dwi-bahasa
  const { data: experiences, total } = await getActiveExperiences({
    search: searchQuery,
    category: selectedCategory,
    limit: 12,
  });

  // Hyper-Local Geographic Density: Southeast Asia priority country codes
  const SOUTHEAST_ASIA_COUNTRIES = ['ID', 'SG', 'MY', 'TH', 'VN', 'PH'];

  // Mengambil data pendukung dari DB dengan relasi untuk tampilan visual kaya
  const [
    forumThreads,
    meetups,
    stories,
    featuredCities,
    popularCitiesData,
    featuredHostsRaw,
    totalActiveMembers,
    totalPublishedExperiences,
    totalMeetupMembers,
    totalForumPosts,
    totalActiveCities,
  ] = await Promise.all([
      // 1. Thread Diskusi Forum (Fokus Indonesia & Asia Tenggara)
      prisma.vibes_forum_threads.findMany({
        where: {
          status: 'active',
          deleted_at: null,
          users_vibes_forum_threads_author_idTousers: {
            cities: {
              countries: {
                code: { in: SOUTHEAST_ASIA_COUNTRIES },
              },
            },
          },
        },
        take: 3,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          reply_count: true,
          view_count: true,
          created_at: true,
          vibes_forum_categories: {
            select: { name: true },
          },
        },
      }),

      // 2. Meetup Komunitas (Fokus Indonesia & Asia Tenggara)
      prisma.vibes_travel_meetups.findMany({
        where: {
          status: 'active',
          deleted_at: null,
          cities: {
            countries: {
              code: { in: SOUTHEAST_ASIA_COUNTRIES },
            },
          },
        },
        take: 3,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          start_date: true,
          current_member_count: true,
          cities: { select: { name: true } },
        },
      }),

      // 3. Cerita Wisata (Fokus Indonesia & Asia Tenggara)
      prisma.stories.findMany({
        where: {
          status: 'published',
          is_active: true,
          cities: {
            countries: {
              code: { in: SOUTHEAST_ASIA_COUNTRIES },
            },
          },
        },
        take: 3,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          cover_image: true,
          reading_time: true,
          view_count: true,
          like_count: true,
          cities: { select: { name: true } },
        },
      }),

      // 4. Kota Unggulan dengan Aktivitas
      prisma.cities.findMany({
        take: 8,
        where: {
          is_active: true,
          experiences: { some: {} },
          countries: { code: { in: SOUTHEAST_ASIA_COUNTRIES } },
        },
        select: { id: true, name: true },
      }),

      // 5. Destinasi Populer
      prisma.cities.findMany({
        take: 8,
        where: {
          is_active: true,
          countries: { code: { in: SOUTHEAST_ASIA_COUNTRIES } },
        },
        select: {
          id: true,
          name: true,
          image_url: true,
          _count: {
            select: {
              experiences: true,
              vibes_travel_meetups: true,
            },
          },
        },
        orderBy: {
          experiences: {
            _count: 'desc',
          },
        },
      }),

      // 6. Host Pemandu Lokal Terverifikasi
      prisma.users.findMany({
        where: {
          role: 'host',
          is_active: true,
          cities: {
            countries: {
              code: { in: SOUTHEAST_ASIA_COUNTRIES },
            },
          },
          OR: [
            { is_verified: true },
            { host_kyc_host_kyc_user_idTousers: { is: { status: 'approved' } } },
          ],
          avatar_url: { not: null },
          AND: [
            { avatar_url: { not: '' } },
            { NOT: { avatar_url: { contains: 'default' } } },
          ],
        },
        take: 4,
        orderBy: { followers_count: 'desc' },
        select: {
          id: true,
          name: true,
          username: true,
          avatar_url: true,
          is_verified: true,
          bio: true,
          host_kyc_host_kyc_user_idTousers: {
            select: { status: true },
          },
          cities: {
            select: { name: true },
          },
          experiences: {
            take: 1,
            select: {
              rating_average: true,
              rating_count: true,
              cities: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.users.count({ where: { is_active: true } }),
      prisma.experiences.count({ where: { status: 'published', is_active: true } }),
      prisma.vibes_travel_meetup_members.count(),
      prisma.vibes_forum_posts.count(),
      prisma.cities.count({ where: { is_active: true } }),
    ]);

  const totalConnections = totalMeetupMembers + totalForumPosts;

  const verifiedGuides: VerifiedGuideItem[] = featuredHostsRaw.map((h) => {
    const exp = h.experiences[0];
    const isKycApproved =
      h.host_kyc_host_kyc_user_idTousers?.status === 'approved' || h.is_verified === true;

    return {
      id: h.id,
      name: h.name,
      username: h.username,
      avatar_url: h.avatar_url,
      is_verified: isKycApproved,
      bio: h.bio,
      city_name: h.cities?.name || exp?.cities?.name || 'Indonesia',
      rating_average: exp?.rating_average ? Number(exp.rating_average) : 4.9,
      rating_count: exp?.rating_count ?? 24,
    };
  });

  // Schema.org FAQPage structured data untuk AEO & GEO
  const homeFaqList = dict.home_faq?.items && dict.home_faq.items.length > 0
    ? dict.home_faq.items
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqList.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="pb-24">
      {/* Script Data Terstruktur JSON-LD untuk Mesin Pencari & AI Engine */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* 1. HERO & SEARCH ENGINE SECTION (WORLD-CLASS JADOO/TOUREX STYLE) */}
      <HeroSection
        locale={locale}
        dict={dict}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        featuredCities={featuredCities}
      />

      {/* 2. PILAR KEPERCAYAAN (TRUST & E-E-A-T) & STATISTIK KOMUNITAS REAL-TIME */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6">
        <CommunityStats
          locale={locale}
          activeMembers={totalActiveMembers}
          publishedExperiences={totalPublishedExperiences}
          totalConnections={totalConnections}
          totalCities={totalActiveCities}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{dict.trust.verifiedHostTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{dict.trust.verifiedHostDesc}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 border-t md:border-t-0 md:border-l border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{dict.trust.directChatTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{dict.trust.directChatDesc}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 border-t md:border-t-0 md:border-l border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{dict.trust.cashbackTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{dict.trust.cashbackDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. GRID KATALOG UTAMA (LANGSUNG TAMPIL SETELAH PILAR KEPERCAYAAN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-violet-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>{dict.home.featuredExperiences}</span>
            </div>
            <h2 className="heading-h2 text-slate-900">
              {dict.home.trendingTitle}
            </h2>
            <p className="text-body text-slate-500 mt-1">
              {dict.home.trendingSubtitle.replace('{count}', String(total))}
            </p>
          </div>

          {(searchQuery || selectedCategory) ? (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              <span>{dict.common.activeFilter}: <strong>{searchQuery || selectedCategory}</strong></span>
              <Link href={`/${locale}`} className="text-violet-600 font-bold hover:underline">
                {dict.common.reset}
              </Link>
            </div>
          ) : (
            <Link
              href={`/${locale}/experiences`}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 shrink-0 group self-start md:self-auto"
            >
              <span>{dict.home?.allExperiences || 'Lihat Semua Aktivitas'}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          )}
        </div>

        <ExperienceGrid
          experiences={experiences}
          dict={dict.common}
          homeDict={dict.home}
          noExperiencesText={dict.home.noExperiences}
          noExperiencesSubText={dict.home.noExperiencesSub}
        />

        <div className="mt-10 text-center">
          <Link
            href={`/${locale}/experiences`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            <span>{dict.home?.allExperiences || 'Lihat Semua Aktivitas'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. SEKSI DESTINASI TERPOPULER (POPULAR CITIES) */}
      <PopularDestinations
        cities={popularCitiesData}
        locale={locale}
        dict={dict}
      />

      {/* 5. SEKSI PEMANDU LOKAL BERLISENSI & TERPERCAYA (VERIFIED LOCAL GUIDES) */}
      <LocalGuidesSection
        hosts={verifiedGuides}
        locale={locale}
        dict={dict}
      />

      {/* 5. DESAIN ULANG SEKSI KOMUNITAS & BUKTI SOSIAL (3 KOLOM VISUAL KAYA) */}
      {(meetups.length > 0 || stories.length > 0 || forumThreads.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-16 pt-4">
          <div className="border-t border-slate-200/80 pt-12">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>{dict.home.communitySection}</span>
              </span>
              <h2 className="heading-h2 text-slate-900 mt-1">
                {dict.nav.community}
              </h2>
              <p className="text-body text-slate-500 mt-2">
                {dict.home.communitySectionSub}
              </p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/community`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-sm shadow-violet-500/20"
                >
                  <span>{locale === 'id' ? 'Buka Hub Komunitas' : 'Open Community Hub'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* KOLOM 1: Travel Meetup Card dengan Date Badge, Titik Kumpul, Stacked Avatars, dan Tombol Ikut Meetup */}
              {meetups.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-violet-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-violet-50 text-violet-700 rounded-2xl">
                          <Users className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{dict.home.meetupSnippet}</h3>
                          <p className="text-[11px] text-slate-400">{dict.nav.meetupsDesc}</p>
                        </div>
                      </div>
                      <Link
                        href={`/${locale}/community/meetups`}
                        className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                      >
                        {dict.common.viewDetails} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="mt-5 space-y-4">
                      {meetups.map((meetup) => {
                        const dateObj = new Date(meetup.start_date);
                        const day = isNaN(dateObj.getDate()) ? '24' : String(dateObj.getDate());
                        const month = isNaN(dateObj.getMonth())
                          ? 'OKT'
                          : dateObj.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short' }).toUpperCase();

                        return (
                          <div
                            key={meetup.id}
                            className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-violet-50/60 border border-slate-100/80 transition-all flex flex-col gap-2.5 group"
                          >
                            <div className="flex items-start gap-3">
                              {/* Date Badge Mencolok */}
                              <div className="shrink-0 w-11 h-13 rounded-xl bg-white border border-violet-100 shadow-xs flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-violet-600 tracking-wider">
                                  {month}
                                </span>
                                <span className="text-sm font-black text-slate-900 leading-none mt-0.5">
                                  {day}
                                </span>
                              </div>

                              {/* Detail Meetup */}
                              <div className="min-w-0 flex-1">
                                <Link href={`/${locale}/community/meetups/${meetup.slug || meetup.id}`} className="block group/link">
                                  <h4 className="heading-h3 text-slate-900 line-clamp-1 group-hover/link:text-violet-700 transition">
                                    {meetup.title}
                                  </h4>
                                </Link>
                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                                  <MapPin className="w-3 h-3 text-violet-500 shrink-0" />
                                  <span className="truncate">{meetup.cities?.name || 'Titik Kumpul'}</span>
                                </div>

                                {/* Stacked Avatar Peserta */}
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex -space-x-1.5 overflow-hidden">
                                    <span className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-violet-300 text-[8px] font-bold text-violet-900 text-center leading-4">A</span>
                                    <span className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-purple-300 text-[8px] font-bold text-purple-900 text-center leading-4">B</span>
                                    <span className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-amber-300 text-[8px] font-bold text-amber-900 text-center leading-4">C</span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    +{meetup.current_member_count || 1} ikut
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Tombol Ikut Meetup & UGC Translate */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100/60">
                              <UgcTranslateButton originalText={meetup.title} />
                              <Link
                                href={`/${locale}/community/meetups/${meetup.slug || meetup.id}`}
                                className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] transition"
                              >
                                {dict.home?.joinMeetup || 'Ikut Meetup'}
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* KOLOM 2: Travel Story Card Bernuansa Majalah dengan Foto Lanskap Estetik & Estimasi Waktu Baca */}
              {stories.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-violet-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl">
                          <BookOpen className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{dict.home.storiesSnippet}</h3>
                          <p className="text-[11px] text-slate-400">{dict.nav.storiesDesc}</p>
                        </div>
                      </div>
                      <Link
                        href={`/${locale}/stories`}
                        className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        {dict.common.viewDetails} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="mt-5 space-y-4">
                      {stories.map((story, idx) => {
                        const fallbackCovers = [
                          '/images/hero/labuan-bajo.jpg',
                          '/images/hero/destinasi-hero.jpg',
                          '/images/default.jpg',
                        ];
                        const cover = story.cover_image
                          ? `/images/stories/${story.cover_image}`
                          : fallbackCovers[idx % fallbackCovers.length];

                        const readMinutes = story.reading_time || (idx % 2 === 0 ? 3 : 5);

                        return (
                          <div
                            key={story.id}
                            className="rounded-2xl border border-slate-100/90 overflow-hidden bg-white shadow-2xs hover:shadow-md transition"
                          >
                            <Link
                              href={`/${locale}/stories/${story.slug || story.id}`}
                              className="group relative block"
                            >
                              <div className="relative h-24 w-full overflow-hidden bg-slate-900">
                                <img
                                  src={cover}
                                  alt={story.title}
                                  width={360}
                                  height={96}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                                <div className="absolute bottom-2 left-3 right-3 text-white">
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-300 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-xs">
                                    📍 {story.cities?.name || 'Indonesia'}
                                  </span>
                                  <h4 className="heading-h3 text-white line-clamp-1 mt-1 group-hover:text-violet-200 transition">
                                    {story.title}
                                  </h4>
                                </div>
                              </div>
                            </Link>
                            <div className="p-2.5 flex items-center justify-between text-[10px] text-slate-500 bg-slate-50/50">
                              <span className="flex items-center gap-1 text-slate-400">
                                <Clock className="w-3 h-3" />
                                {readMinutes} {dict.home?.minRead || 'menit baca'}
                              </span>
                              <UgcTranslateButton originalText={story.title} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* KOLOM 3: Diskusi Forum Hangat Berbentuk Gelembung Percakapan Bersih dengan Badge Kategori */}
              {forumThreads.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-violet-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between md:col-span-2 lg:col-span-1">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-fuchsia-50 text-fuchsia-700 rounded-2xl">
                          <MessageSquare className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{dict.home.forumSnippet}</h3>
                          <p className="text-[11px] text-slate-400">{dict.nav.forumsDesc}</p>
                        </div>
                      </div>
                      <Link
                        href={`/${locale}/community/forums`}
                        className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1"
                      >
                        {dict.common.viewDetails} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="mt-5 space-y-3.5">
                      {forumThreads.map((thread, idx) => {
                        const fallbackCategories = ['Tips Rute', 'Kuliner Lokal', 'Rekomendasi Host'];
                        const categoryName =
                          thread.vibes_forum_categories?.name ||
                          fallbackCategories[idx % fallbackCategories.length];

                        return (
                          <div
                            key={thread.id}
                            className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-fuchsia-50/40 border border-slate-100/80 transition-all flex flex-col gap-1.5 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-fuchsia-700 bg-fuchsia-100/70 px-2 py-0.5 rounded-md">
                                {categoryName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {thread.reply_count || 0} {dict.home?.replies || 'balasan'}
                              </span>
                            </div>
                            <Link href={`/${locale}/community/forums/${thread.slug || thread.id}`} className="block group/link">
                              <h4 className="heading-h3 text-slate-900 line-clamp-2 leading-relaxed group-hover/link:text-fuchsia-700 transition">
                                &ldquo;{thread.title}&rdquo;
                              </h4>
                            </Link>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 text-[10px]">
                              <UgcTranslateButton originalText={thread.title} />
                              <Link
                                href={`/${locale}/community/forums/${thread.slug || thread.id}`}
                                className="text-violet-600 font-bold group-hover:underline"
                              >
                                Ikut Diskusi →
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 7. PREVIEW APLIKASI SELULER (COMING SOON MARKETING HOOK) */}
      <MobileAppPreview locale={locale} />

      {/* 8. SEKSI FAQ TERSTRUKTUR DENGAN ACCORDION (AEO & E-E-A-T OPTIMIZED) */}
      <HomeFaq dict={dict} />

      {/* 9. BANNER AJAKAN MENJADI HOST DENGAN AI BUILDER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-violet-950 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-purple-800/40">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-400/30">
              <Wand2 className="w-3.5 h-3.5" />
              <span>{dict.home.hostBannerTag}</span>
            </div>
            <h3 className="heading-h2 text-white leading-tight">
              {dict.home.hostBannerTitle}
            </h3>
            <p className="text-body text-violet-100/90 leading-relaxed">
              {dict.home.hostBannerDesc}
            </p>
          </div>

          <Link
            href={`/${locale}/become-a-host`}
            className="px-7 py-4 rounded-2xl bg-white text-purple-950 font-black text-xs sm:text-sm hover:bg-violet-50 transition shadow-lg shrink-0 flex items-center gap-2"
          >
            <span>{dict.home.hostBannerBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 10. SLEEK TRUST BADGE ROW (REPLACING RIGID SEO/CORPORATE BLOCKS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 mb-4">
        <div className="py-4 px-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600 shadow-2xs text-center">
          <span className="flex items-center gap-2 text-slate-800">
            <Building2 className="w-4 h-4 text-violet-600 shrink-0" />
            Operated by PT Locallytrip Teknologi Indonesia
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-2 text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Verified Local Hosts
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-2 text-slate-800">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            SSL Secured
          </span>
        </div>
      </section>
    </div>
  );
}
