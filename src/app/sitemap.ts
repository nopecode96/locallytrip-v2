import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { enum_experiences_status } from '@prisma/client';

export const revalidate = 3600; // Cache sitemap selama 1 jam untuk performa & efisiensi crawler

const LOCALES = ['id', 'en'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Selalu gunakan domain absolut https://locallytrip.com untuk standar XML Sitemap SEO
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'https://locallytrip.com').replace(/\/+$/, '');
  const now = new Date();

  // 1. Rute Statis Inti (Core Routes)
  const coreStaticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/explore', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/experiences', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/community', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/community/forums', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/community/meetups', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/stories', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/community/perks', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/community/rewards', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/become-a-host', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/partner-with-us', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/help', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/cookie-policy', priority: 0.4, changeFrequency: 'monthly' as const },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries untuk Core Static Routes (id dan en)
  for (const route of coreStaticRoutes) {
    for (const locale of LOCALES) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            id: `${baseUrl}/id${route.path}`,
            en: `${baseUrl}/en${route.path}`,
          },
        },
      });
    }
  }

  // 2. Query Data Dinamis dari Prisma secara Paralel
  try {
    const [experiences, stories, meetups, forumThreads, cities] = await Promise.all([
      // Pengalaman Tur Terbit & Aktif
      prisma.experiences.findMany({
        where: {
          status: enum_experiences_status.published,
          is_active: true,
        },
        select: {
          id: true,
          slug: true,
          updated_at: true,
          created_at: true,
        },
      }),

      // Cerita Wisata / Travel Stories Terbit
      prisma.stories.findMany({
        where: {
          status: 'published',
          is_active: true,
        },
        select: {
          id: true,
          slug: true,
          updated_at: true,
          created_at: true,
        },
      }),

      // Temu Komunitas / Travel Meetups Aktif
      prisma.vibes_travel_meetups.findMany({
        where: {
          status: 'active',
        },
        select: {
          id: true,
          slug: true,
          updated_at: true,
          created_at: true,
        },
      }),

      // Forum Diskusi Komunitas Aktif
      prisma.vibes_forum_threads.findMany({
        where: {
          status: 'active',
        },
        select: {
          id: true,
          slug: true,
          updated_at: true,
          created_at: true,
        },
      }),

      // Kota / Destinasi Aktif
      prisma.cities.findMany({
        where: {
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          updated_at: true,
          created_at: true,
        },
      }),
    ]);

    // 3. Entries untuk Pengalaman Tur (Experiences)
    for (const exp of experiences) {
      const cleanSlug = exp.slug ? exp.slug.replace(/-+$/, '') : String(exp.id);
      const lastMod = exp.updated_at || exp.created_at || now;

      for (const locale of LOCALES) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/experiences/${cleanSlug}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates: {
            languages: {
              id: `${baseUrl}/id/experiences/${cleanSlug}`,
              en: `${baseUrl}/en/experiences/${cleanSlug}`,
            },
          },
        });
      }
    }

    // 4. Entries untuk Cerita Wisata (Stories)
    for (const story of stories) {
      const cleanSlug = story.slug ? story.slug.replace(/-+$/, '') : String(story.id);
      const lastMod = story.updated_at || story.created_at || now;

      for (const locale of LOCALES) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/stories/${cleanSlug}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: {
              id: `${baseUrl}/id/stories/${cleanSlug}`,
              en: `${baseUrl}/en/stories/${cleanSlug}`,
            },
          },
        });
      }
    }

    // 5. Entries untuk Temu Komunitas (Meetups)
    for (const meetup of meetups) {
      const cleanSlug = meetup.slug ? meetup.slug.replace(/-+$/, '') : String(meetup.id);
      const lastMod = meetup.updated_at || meetup.created_at || now;

      for (const locale of LOCALES) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/community/meetups/${cleanSlug}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: {
              id: `${baseUrl}/id/community/meetups/${cleanSlug}`,
              en: `${baseUrl}/en/community/meetups/${cleanSlug}`,
            },
          },
        });
      }
    }

    // 6. Entries untuk Forum Diskusi (Forums)
    for (const thread of forumThreads) {
      const cleanSlug = thread.slug ? thread.slug.replace(/-+$/, '') : String(thread.id);
      const lastMod = thread.updated_at || thread.created_at || now;

      for (const locale of LOCALES) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/community/forums/${cleanSlug}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: {
              id: `${baseUrl}/id/community/forums/${cleanSlug}`,
              en: `${baseUrl}/en/community/forums/${cleanSlug}`,
            },
          },
        });
      }
    }

    // 7. Entries untuk Destinasi / Kota (Destination Hubs)
    for (const city of cities) {
      const citySlug = city.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (!citySlug) continue;
      const lastMod = city.updated_at || city.created_at || now;

      for (const locale of LOCALES) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/destination/${citySlug}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates: {
            languages: {
              id: `${baseUrl}/id/destination/${citySlug}`,
              en: `${baseUrl}/en/destination/${citySlug}`,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap from database:', error);
  }

  return sitemapEntries;
}
