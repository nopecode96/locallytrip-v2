import { redirect } from 'next/navigation';

export default async function VibesForumsRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolved = await params;
  const lang = resolved.lang === 'en' ? 'en' : 'id';
  redirect(`/${lang}/community/forums`);
}
