import React from 'react';
import {
  getAdminForumCategories,
  getAdminExperienceTypes,
  getAdminStoryCategories,
} from '@/actions/admin/master';
import { CategoriesControlClient } from '@/components/admin/master/CategoriesControlClient';

export const dynamic = 'force-dynamic';

interface AdminCategoriesPageProps {
  searchParams?: Promise<{
    tab?: string;
  }>;
}

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const validTabs = ['forums', 'experiences', 'stories'];
  const initialTab = (resolvedParams?.tab && validTabs.includes(resolvedParams.tab))
    ? (resolvedParams.tab as 'forums' | 'experiences' | 'stories')
    : 'forums';

  const [forumsRes, experiencesRes, storiesRes] = await Promise.all([
    getAdminForumCategories({ limit: 100 }),
    getAdminExperienceTypes({ limit: 100 }),
    getAdminStoryCategories({ limit: 100 }),
  ]);

  return (
    <CategoriesControlClient
      initialForumCategories={forumsRes.data || []}
      initialExperienceTypes={experiencesRes.data || []}
      initialStoryCategories={storiesRes.data || []}
      initialTab={initialTab}
    />
  );
}
