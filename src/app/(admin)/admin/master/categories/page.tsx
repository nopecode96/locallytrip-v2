import React from 'react';
import {
  getAdminForumCategories,
  getAdminExperienceTypes,
  getAdminStoryCategories,
} from '@/actions/admin/master';
import { CategoriesControlClient } from '@/components/admin/master/CategoriesControlClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const [forumsRes, experiencesRes, storiesRes] = await Promise.all([
    getAdminForumCategories({ limit: 100 }),
    getAdminExperienceTypes({ limit: 100 }),
    getAdminStoryCategories({ limit: 100 }),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <CategoriesControlClient
        initialForumCategories={forumsRes.data || []}
        initialExperienceTypes={experiencesRes.data || []}
        initialStoryCategories={storiesRes.data || []}
      />
    </div>
  );
}
