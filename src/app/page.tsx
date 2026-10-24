import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locallytrip_locale')?.value || 'id';
  const targetLocale = savedLocale === 'en' ? 'en' : 'id';
  redirect(`/${targetLocale}`);
}
