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

  // 2. Query Data Dinamis dari Prisma dengan Individual Try-Catch & Safe Fallback

  // 2.1 Pengalaman Tur Terbit & Aktif (Experiences)
  try {
    const experiences = await prisma.experiences.findMany({
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
    });

    if (!experiences || experiences.length === 0) {
      console.warn('[sitemap] Warning: No active experiences found in database.');
    } else {
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
    }
  } catch (error) {
    console.warn('[sitemap] Error fetching experiences for sitemap:', error);
  }

  // 2.2 Cerita Wisata / Travel Stories Terbit (Stories)
  try {
    const stories = await prisma.stories.findMany({
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
    });

    if (!stories || stories.length === 0) {
      console.warn('[sitemap] Warning: No active stories found in database.');
    } else {
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
    }
  } catch (error) {
    console.warn('[sitemap] Error fetching stories for sitemap:', error);
  }

  // 2.3 Temu Komunitas / Travel Meetups Aktif (Meetups)
  try {
    // Dukung delegate vibesTravelMeetups maupun vibes_travel_meetups
    const meetupsDelegate = (prisma as any).vibesTravelMeetups || prisma.vibes_travel_meetups;
    const meetups = await meetupsDelegate.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        slug: true,
        updated_at: true,
        created_at: true,
      },
    });

    if (!meetups || meetups.length === 0) {
      console.warn('[sitemap] Warning: No active meetups found in database.');
    } else {
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
    }
  } catch (error) {
    console.warn('[sitemap] Error fetching meetups for sitemap:', error);
  }

  // 2.4 Forum Diskusi Komunitas Aktif (Forums)
  try {
    // Dukung delegate vibesForumThreads maupun vibes_forum_threads
    const forumDelegate = (prisma as any).vibesForumThreads || prisma.vibes_forum_threads;
    const forumThreads = await forumDelegate.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        slug: true,
        updated_at: true,
        created_at: true,
      },
    });

    if (!forumThreads || forumThreads.length === 0) {
      console.warn('[sitemap] Warning: No active forum threads found in database.');
    } else {
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
    }
  } catch (error) {
    console.warn('[sitemap] Error fetching forum threads for sitemap:', error);
  }

  // 2.5 Destinasi / Kota Aktif (Destination Hubs)
  try {
    const cities = await prisma.cities.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        updated_at: true,
        created_at: true,
      },
    });

    if (!cities || cities.length === 0) {
      console.warn('[sitemap] Warning: No active cities found in database.');
    } else {
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
    }
  } catch (error) {
    console.warn('[sitemap] Error fetching cities for sitemap:', error);
  }

  return sitemapEntries;
}
