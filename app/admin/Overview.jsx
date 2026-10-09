'use client';
import { Users, Send, MessageSquareHeart, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { go } from './nav';
import ThemePicker from './ThemePicker';
import { AttendBadge } from './AttendBadge';

const Stat = ({ icon: Icon, label, value, hint }) => (
  <Card className="gap-2">
    <CardHeader>
      <CardDescription>{label}</CardDescription>
      <CardAction><Icon className="text-muted-foreground size-4" /></CardAction>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </CardContent>
  </Card>
);

export default function Overview({ themes, theme, guests, wishes }) {
  const sent = guests.filter(g => g.sent_at).length;
  const count = a => wishes.filter(w => w.attend === a).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Ringkasan</h1>
        <p className="text-muted-foreground text-sm">Akad Sabtu, 31 Oktober 2026 · Ngunduh mantu Minggu, 1 November 2026</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Total tamu" value={guests.length} hint={`${guests.filter(g => !g.phone).length} tanpa nomor WA`} />
        <Stat icon={Send} label="Undangan terkirim" value={sent} hint={guests.length ? `${Math.round((sent / guests.length) * 100)}% dari daftar tamu` : 'Belum ada tamu'} />
        <Stat icon={MessageSquareHeart} label="Ucapan masuk" value={wishes.length} />
        <Stat icon={CalendarCheck} label="Konfirmasi hadir" value={count('Hadir')} hint={`${count('Tidak Hadir')} tidak hadir · ${count('Ragu-ragu')} ragu`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template undangan</CardTitle>
          <CardDescription>Dipakai untuk halaman utama dan semua link WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent><ThemePicker themes={themes} current={theme} /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ucapan terbaru</CardTitle>
          <CardAction><Button variant="outline" size="sm" asChild><a href="/admin/ucapan/" onClick={go}>Lihat semua</a></Button></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {wishes.length === 0 && <p className="text-muted-foreground text-sm">Belum ada ucapan.</p>}
          {wishes.slice(0, 3).map(w => (
            <div key={w.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2"><span className="font-medium">{w.name}</span><AttendBadge attend={w.attend} /></div>
              <p className="text-muted-foreground line-clamp-2 text-sm">{w.msg}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
