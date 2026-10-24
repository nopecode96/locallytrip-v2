import { redirect } from 'next/navigation';

export default async function PublicAuthLoginRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedQuery = await searchParams;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const cb = resolvedQuery.callbackUrl
    ? `?callbackUrl=${encodeURIComponent(resolvedQuery.callbackUrl)}`
    : '';

  redirect(`/${lang}/login${cb}`);
}
