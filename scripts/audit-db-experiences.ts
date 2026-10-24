import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('🔍 DEEP AUDIT: EXPERIENCES, HOST CATEGORIES, ARCHETYPES & DATA');
  console.log('================================================================\n');

  // 1. Audit host_categories
  console.log('--- 1. TABLE: host_categories ---');
  const hostCategories = await prisma.host_categories.findMany({
    orderBy: { id: 'asc' },
    include: {
      _count: {
        select: {
          experiences: true,
          user_host_categories: true,
        },
      },
    },
  });

  console.table(
    hostCategories.map((c) => ({
      ID: c.id,
      Name: c.name,
      Icon: c.icon,
      SortOrder: c.sort_order,
      IsActive: c.is_active,
      ExperiencesCount: c._count.experiences,
      HostUsersCount: c._count.user_host_categories,
    }))
  );

  // 2. Audit experience_types
  console.log('\n--- 2. TABLE: experience_types ---');
  const experienceTypes = await prisma.experience_types.findMany({
    orderBy: { id: 'asc' },
    include: {
      _count: {
        select: {
          experiences: true,
        },
      },
    },
  });

  console.table(
    experienceTypes.map((t) => ({
      ID: t.id,
      Name: t.name,
      Icon: t.icon,
      SortOrder: t.sort_order,
      IsActive: t.is_active,
      RiskLevel: t.risk_level,
      ReqPassport: t.requires_passport,
      ExperiencesCount: t._count.experiences,
    }))
  );

  // 3. Audit all experiences summary
  console.log('\n--- 3. TABLE: experiences OVERVIEW ---');
  const totalExperiences = await prisma.experiences.count();
  console.log(`Total experiences in DB: ${totalExperiences}`);

  const statusCount = await prisma.experiences.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  console.log('Status breakdown:', statusCount);

  const categoryBreakdown = await prisma.experiences.groupBy({
    by: ['category_id'],
    _count: { id: true },
  });
  console.log('host_categories (category_id) breakdown:', categoryBreakdown);

  const typeBreakdown = await prisma.experiences.groupBy({
    by: ['experience_type_id'],
    _count: { id: true },
  });
  console.log('experience_types (experience_type_id) breakdown:', typeBreakdown);

  // 4. Sample Rows for Each Archetype
  console.log('\n--- 4. SAMPLES PER CATEGORY ARCHETYPE ---');

  for (const hc of hostCategories) {
    const sample = await prisma.experiences.findFirst({
      where: { category_id: hc.id },
      include: {
        experience_itineraries: {
          orderBy: { step_order: 'asc' },
        },
        host_categories: true,
        experience_types: true,
        cities: true,
        users: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (sample) {
      console.log(`\n========================================================`);
      console.log(`🎯 ARCHETYPE SAMPLE: [${hc.name}] (ID: ${hc.id})`);
      console.log(`========================================================`);
      console.log(`Title: ${sample.title}`);
      console.log(`Title ID: ${sample.title_id}`);
      console.log(`Title EN: ${sample.title_en}`);
      console.log(`Slug: ${sample.slug}`);
      console.log(`City: ${sample.cities?.name} (ID: ${sample.city_id})`);
      console.log(`Host: ${sample.users?.name} (ID: ${sample.host_id}, Role: ${sample.users?.role})`);
      console.log(`Experience Type ID: ${sample.experience_type_id} (${sample.experience_types?.name || 'NULL'})`);
      console.log(`Package Price: ${sample.package_price} ${sample.currency}`);
      console.log(`Duration: ${sample.duration_hours} hours`);
      console.log(`Max/Min Participants: ${sample.max_participants} / ${sample.min_participants}`);
      console.log(`Meeting Point: ${sample.meeting_point}`);
      console.log(`Ending Point: ${sample.ending_point}`);
      console.log(`Walking Distance: ${sample.walking_distance_km} km`);
      console.log(`Difficulty / Fitness: ${sample.difficulty_level} / ${sample.fitness_level}`);
      console.log(`Images column type/content:`, typeof sample.images, Array.isArray(sample.images) ? `Array[${(sample.images as any).length}]` : sample.images);
      console.log(`Included Items:`, sample.included_items);
      console.log(`Excluded Items:`, sample.excluded_items);
      console.log(`Requirements (What to bring):`, sample.requirements);
      console.log(`Deliverables:`, sample.deliverables);
      console.log(`Equipment Used:`, sample.equipment_used);
      console.log(`Host Specific Data:`, sample.host_specific_data);
      console.log(`What to expect:`, sample.what_to_expect);
      console.log(`Itinerary Count in experience_itineraries:`, sample.experience_itineraries.length);
      if (sample.experience_itineraries.length > 0) {
        console.log(`Itinerary sample steps:`, sample.experience_itineraries.slice(0, 3).map(s => ({
          step: s.step_order,
          title: s.title,
          duration: s.duration_minutes,
          loc: s.location
        })));
      }
    } else {
      console.log(`\n⚠️ No experience found for category: [${hc.name}] (ID: ${hc.id})`);
    }
  }

  // 5. Inspect user_host_categories
  console.log('\n--- 5. user_host_categories TABLE SAMPLE ---');
  const userCatCount = await prisma.user_host_categories.count();
  console.log(`Total user_host_categories rows: ${userCatCount}`);

  const userCatSamples = await prisma.user_host_categories.findMany({
    take: 10,
    include: {
      users: { select: { id: true, name: true, role: true } },
      host_categories: true,
    },
  });
  console.table(
    userCatSamples.map((u) => ({
      ID: u.id,
      UserID: u.user_id,
      UserName: u.users?.name,
      Role: u.users?.role,
      CategoryID: u.host_category_id,
      CategoryName: u.host_categories?.name,
      IsPrimary: u.is_primary,
    }))
  );

  // 6. Inspect experience_itineraries total
  console.log('\n--- 6. experience_itineraries TABLE STATS ---');
  const itineraryCount = await prisma.experience_itineraries.count();
  console.log(`Total rows in experience_itineraries: ${itineraryCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
