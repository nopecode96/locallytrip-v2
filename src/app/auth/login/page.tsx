import { redirect } from 'next/navigation';

export default async function AuthLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const query = await searchParams;
  const cb = query.callbackUrl ? `?callbackUrl=${encodeURIComponent(query.callbackUrl)}` : '';
  redirect(`/id/login${cb}`);
}
