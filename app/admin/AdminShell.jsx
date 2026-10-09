'use client';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, MessageSquareHeart, LogOut } from 'lucide-react';
import { MacOSSidebar } from '@/components/watermelon/macos-sidebar';
import { Button } from '@/components/ui/button';
import { logout } from './actions';
import { go, isActive } from './nav';

const NAV = [
  { label: 'Ringkasan', href: '/admin/', icon: LayoutDashboard },
  { label: 'Tamu', href: '/admin/tamu/', icon: Users },
  { label: 'Ucapan', href: '/admin/ucapan/', icon: MessageSquareHeart },
];

const Brand = () => (
  <div className="leading-tight">
    <p className="font-heading text-sm font-semibold">Ammar &amp; Yulia</p>
    <p className="text-muted-foreground text-xs">Admin undangan</p>
  </div>
);

const Logout = ({ compact }) => (
  <form action={logout}>
    <Button variant="ghost" size={compact ? 'icon' : 'sm'} className="text-muted-foreground w-full justify-start" aria-label="Keluar">
      <LogOut /> {!compact && 'Keluar'}
    </Button>
  </form>
);

export default function AdminShell({ children }) {
  const path = usePathname();
  return (
    <MacOSSidebar items={NAV} header={<Brand />} footer={<Logout />}>
      {/* HP: bar atas + navigasi bawah yang mudah dijangkau jempol */}
      <header className="bg-background/80 sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <Logout compact />
      </header>
      <main className="mx-auto w-full max-w-5xl p-4 pb-24 md:p-8">{children}</main>
      <nav className="bg-background/90 fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t backdrop-blur md:hidden">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <a key={href} href={href} onClick={go} className={`flex flex-col items-center gap-1 py-2.5 text-xs ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              <Icon className="size-5" /> {label}
            </a>
          );
        })}
      </nav>
    </MacOSSidebar>
  );
}
