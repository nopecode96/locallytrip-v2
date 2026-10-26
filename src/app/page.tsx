import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';

export default async function RootPage() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const cleanHost = host.toLowerCase().split(':')[0];
  const isAdminHost =
    cleanHost === 'admin.locallytrip.com' ||
    cleanHost === 'admin.locallytrip.local' ||
    cleanHost === 'admin.localhost' ||
    cleanHost.startsWith('admin.');

  if (isAdminHost) {
    redirect('/dashboard');
  }

  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locallytrip_locale')?.value || 'id';
  const targetLocale = savedLocale === 'en' ? 'en' : 'id';
  redirect(`/${targetLocale}`);
}
