import { redirect } from 'next/navigation';

interface DestinationsSlugPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export default async function DestinationsSlugPage({ params }: DestinationsSlugPageProps) {
  const { lang, slug } = await params;
  redirect(`/${lang}/destination/${slug}`);
}
