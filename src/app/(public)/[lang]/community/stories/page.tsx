import { redirect } from 'next/navigation';

interface CommunityStoriesPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function CommunityStoriesRedirectPage({ params }: CommunityStoriesPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/community?tab=stories`);
}
