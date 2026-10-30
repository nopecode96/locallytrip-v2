import prisma from '@/lib/prisma';
import { generateRandomPersona } from '@/lib/ai/personaEngine';
import {
  generateSyntheticStory,
  generateSyntheticForumThread,
  generateSyntheticReply,
  generateSyntheticMeetup,
} from '@/lib/ai/contentEngine';
import { getNaturalAvatarUrl, getNaturalStoryCoverUrl } from '@/lib/ai/imageEngine';

export interface SeedExecutionResult {
  success: boolean;
  action: 'CREATE_USER' | 'CREATE_STORY' | 'CREATE_FORUM_THREAD' | 'CREATE_FORUM_REPLY' | 'CREATE_MEETUP' | 'JOIN_MEETUP';
  details: string;
  recordId?: number;
}

/**
 * 1. Buat User Persona AI Baru
 */
export async function seedNewAiPersona(): Promise<SeedExecutionResult> {
  const profile = generateRandomPersona();
  const avatar = await getNaturalAvatarUrl(profile.gender);

  // Cari ID kota jika ada
  const city = await prisma.cities.findFirst({
    where: { name: { contains: profile.originCity, mode: 'insensitive' } },
    select: { id: true },
  });

  const newUser = await prisma.users.create({
    data: {
      name: profile.name,
      username: profile.username,
      email: profile.email,
      role: 'traveller',
      role_id: 3,
      avatar_url: avatar,
      bio: profile.bio,
      city_id: city?.id || null,
      is_verified: true,
      is_active: true,
      is_trusted: true,
      is_ai_generated: true,
      has_completed_onboarding: true,
      onboarding_interests: profile.interests,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    success: true,
    action: 'CREATE_USER',
    details: `Persona baru dibuat: ${newUser.name} (@${newUser.username}) dari ${profile.originCity}`,
    recordId: newUser.id,
  };
}

/**
 * 2. Buat Cerita Perjalanan AI (Story)
 */
export async function seedNewAiStory(): Promise<SeedExecutionResult> {
  // Ambil author persona AI secara acak
  let author = await prisma.users.findFirst({
    where: { is_ai_generated: true },
    orderBy: { id: 'desc' },
  });

  if (!author) {
    const userRes = await seedNewAiPersona();
    author = await prisma.users.findUnique({ where: { id: userRes.recordId } });
  }

  if (!author) throw new Error('No AI persona available.');

  // Pilih kota secara acak
  const cities = await prisma.cities.findMany({ where: { is_active: true }, take: 10 });
  const targetCity = cities.length > 0 ? cities[Math.floor(Math.random() * cities.length)] : null;
  const cityName = targetCity?.name || 'Bandung';

  const storyContent = await generateSyntheticStory(cityName);
  if (!storyContent) throw new Error('Gemini failed to generate story.');

  const slug = `${storyContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;
  const coverImage = await getNaturalStoryCoverUrl(cityName);

  const story = await prisma.stories.create({
    data: {
      uuid: `story-ai-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: storyContent.title,
      slug,
      content: storyContent.contentMarkdown,
      excerpt: storyContent.excerpt,
      author_id: author.id,
      city_id: targetCity?.id || null,
      cover_image: coverImage,
      meta_title: storyContent.metaTitle,
      meta_description: storyContent.metaDescription,
      tags: storyContent.tags,
      reading_time: 4,
      status: 'published',
      is_active: true,
      is_featured: Math.random() > 0.7,
      is_ai_generated: true,
      view_count: Math.floor(15 + Math.random() * 45),
      like_count: Math.floor(3 + Math.random() * 12),
      comment_count: 0,
      approved_at: new Date(),
      published_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    success: true,
    action: 'CREATE_STORY',
    details: `Story baru dibuat: "${story.title}" oleh ${author.name}`,
    recordId: story.id,
  };
}

/**
 * 3. Buat Thread Forum AI
 */
export async function seedNewAiForumThread(): Promise<SeedExecutionResult> {
  let author = await prisma.users.findFirst({
    where: { is_ai_generated: true },
    orderBy: { id: 'desc' },
  });

  if (!author) {
    const userRes = await seedNewAiPersona();
    author = await prisma.users.findUnique({ where: { id: userRes.recordId } });
  }

  if (!author) throw new Error('No AI persona available.');

  const category = await prisma.vibes_forum_categories.findFirst({
    where: { is_active: true },
  });

  const categoryName = category?.name || 'Travel Tips & Guides';
  const threadContent = await generateSyntheticForumThread(categoryName, 'Bali Denpasar');
  if (!threadContent) throw new Error('Gemini failed to generate forum thread.');

  const slug = `${threadContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

  const thread = await prisma.vibes_forum_threads.create({
    data: {
      category_id: category?.id || 1,
      author_id: author.id,
      title: threadContent.title,
      slug,
      content: threadContent.content,
      status: 'active',
      is_ai_generated: true,
      view_count: Math.floor(10 + Math.random() * 30),
      like_count: Math.floor(2 + Math.random() * 8),
      reply_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    success: true,
    action: 'CREATE_FORUM_THREAD',
    details: `Thread Forum baru dibuat: "${thread.title}" di kategori ${categoryName}`,
    recordId: thread.id,
  };
}

/**
 * 4. Buat Balasan Reply Diskusi Forum oleh Persona AI Lain (Interaksi Sirkular)
 */
export async function seedAiForumReply(): Promise<SeedExecutionResult> {
  // Ambil salah satu thread forum yang aktif
  const thread = await prisma.vibes_forum_threads.findFirst({
    where: { status: 'active' },
    orderBy: { id: 'desc' },
  });

  if (!thread) throw new Error('No forum thread found.');

  // Pilih persona AI yang BUKAN author thread
  let responder = await prisma.users.findFirst({
    where: { is_ai_generated: true, id: { not: thread.author_id } },
  });

  if (!responder) {
    const userRes = await seedNewAiPersona();
    responder = await prisma.users.findUnique({ where: { id: userRes.recordId } });
  }

  if (!responder) throw new Error('No responder available.');

  const replyText = await generateSyntheticReply(thread.content, responder.name);

  const post = await prisma.vibes_forum_posts.create({
    data: {
      thread_id: thread.id,
      author_id: responder.id,
      content: replyText,
      status: 'active',
      is_ai_generated: true,
      like_count: Math.floor(1 + Math.random() * 4),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Update counter thread
  await prisma.vibes_forum_threads.update({
    where: { id: thread.id },
    data: {
      reply_count: { increment: 1 },
      last_reply_at: new Date(),
      last_reply_by: responder.id,
    },
  });

  return {
    success: true,
    action: 'CREATE_FORUM_REPLY',
    details: `${responder.name} membalas thread "${thread.title}": "${replyText.slice(0, 60)}..."`,
    recordId: post.id,
  };
}

/**
 * 5. Buat Agenda Meetup Komunitas AI
 */
export async function seedNewAiMeetup(): Promise<SeedExecutionResult> {
  let creator = await prisma.users.findFirst({
    where: { is_ai_generated: true },
    orderBy: { id: 'desc' },
  });

  if (!creator) {
    const userRes = await seedNewAiPersona();
    creator = await prisma.users.findUnique({ where: { id: userRes.recordId } });
  }

  if (!creator) throw new Error('No creator available.');

  const city = await prisma.cities.findFirst({ where: { is_active: true } });
  const cityName = city?.name || 'Bandung';

  const meetupContent = await generateSyntheticMeetup(cityName);
  if (!meetupContent) throw new Error('Gemini failed to generate meetup.');

  const slug = `${meetupContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

  // Set tanggal mulai 5 - 14 hari ke depan
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + Math.floor(5 + Math.random() * 9));
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const meetup = await prisma.vibes_travel_meetups.create({
    data: {
      creator_id: creator.id,
      city_id: city?.id || 1,
      title: meetupContent.title,
      slug,
      description: meetupContent.description,
      start_date: startDate,
      end_date: endDate,
      duration_days: meetupContent.durationDays,
      max_members: meetupContent.maxMembers,
      current_member_count: 1,
      status: 'active',
      join_type: 'public',
      is_ai_generated: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Tambahkan creator ke member
  await prisma.vibes_travel_meetup_members.create({
    data: {
      meetup_id: meetup.id,
      user_id: creator.id,
      is_creator: true,
      status: 'approved',
      is_ai_generated: true,
      joined_at: new Date(),
      approved_at: new Date(),
    },
  });

  return {
    success: true,
    action: 'CREATE_MEETUP',
    details: `Meetup baru dibuat: "${meetup.title}" di ${cityName} oleh ${creator.name}`,
    recordId: meetup.id,
  };
}

/**
 * 6. Join Meetup Komunitas oleh Persona AI Lain
 */
export async function seedAiJoinMeetup(): Promise<SeedExecutionResult> {
  const meetup = await prisma.vibes_travel_meetups.findFirst({
    where: { status: 'active' },
    orderBy: { id: 'desc' },
  });

  if (!meetup) throw new Error('No meetup found.');

  // Cari persona yang belum join
  const existingMembers = await prisma.vibes_travel_meetup_members.findMany({
    where: { meetup_id: meetup.id },
    select: { user_id: true },
  });
  const joinedUserIds = existingMembers.map((m) => m.user_id);

  let newMember = await prisma.users.findFirst({
    where: { is_ai_generated: true, id: { notIn: joinedUserIds } },
  });

  if (!newMember) {
    const userRes = await seedNewAiPersona();
    newMember = await prisma.users.findUnique({ where: { id: userRes.recordId } });
  }

  if (!newMember) throw new Error('No member available.');

  await prisma.vibes_travel_meetup_members.create({
    data: {
      meetup_id: meetup.id,
      user_id: newMember.id,
      is_creator: false,
      status: 'approved',
      is_ai_generated: true,
      joined_at: new Date(),
      approved_at: new Date(),
    },
  });

  await prisma.vibes_travel_meetups.update({
    where: { id: meetup.id },
    data: { current_member_count: { increment: 1 } },
  });

  return {
    success: true,
    action: 'JOIN_MEETUP',
    details: `${newMember.name} bergabung ke meetup "${meetup.title}"`,
    recordId: meetup.id,
  };
}
