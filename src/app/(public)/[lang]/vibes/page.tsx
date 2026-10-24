import { redirect } from 'next/navigation';

export default async function VibesRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolved = await params;
  const lang = resolved.lang === 'en' ? 'en' : 'id';
  redirect(`/${lang}/community`);
}
