'use client';
import { usePathname } from 'next/navigation';
import Overview from './Overview';
import Guests from './Guests';
import Wishes from './Wishes';

export default function AdminApp({ themes, theme, guests, wishes }) {
  const path = usePathname();
  if (path.startsWith('/admin/tamu')) return <Guests theme={theme} guests={guests} />;
  if (path.startsWith('/admin/ucapan')) return <Wishes wishes={wishes} />;
  return <Overview themes={themes} theme={theme} guests={guests} wishes={wishes} />;
}
