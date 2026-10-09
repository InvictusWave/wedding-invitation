'use client';
import { startTransition, useMemo, useOptimistic, useState } from 'react';
import { Download, Trash2, MessageSquareHeart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { deleteWish } from './actions';
import { AttendBadge } from './AttendBadge';

const FILTERS = ['Semua', 'Hadir', 'Tidak Hadir', 'Ragu-ragu'];

export default function Wishes({ wishes: saved }) {
  const [wishes, drop] = useOptimistic(saved, (list, id) => list.filter(w => w.id !== id));
  const remove = id => startTransition(async () => { drop(id); toast('Ucapan dihapus'); await deleteWish(id); });
  const [filter, setFilter] = useState('Semua');
  const shown = useMemo(() => wishes.filter(w => filter === 'Semua' || w.attend === filter), [wishes, filter]);
  const count = a => (a === 'Semua' ? wishes.length : wishes.filter(w => w.attend === a).length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Ucapan</h1>
          <p className="text-muted-foreground text-sm">Ucapan &amp; konfirmasi kehadiran dari semua template.</p>
        </div>
        <Button variant="outline" asChild><a href="/api/admin/export/"><Download /> Export CSV</a></Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="max-w-full overflow-x-auto">
          {FILTERS.map(f => <TabsTrigger key={f} value={f}>{f} <span className="text-muted-foreground tabular-nums">{count(f)}</span></TabsTrigger>)}
        </TabsList>
      </Tabs>

      {shown.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessageSquareHeart /></EmptyMedia>
            <EmptyTitle>Belum ada ucapan</EmptyTitle>
            <EmptyDescription>Ucapan dari tamu akan muncul di sini.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map(w => (
            <Card key={w.id} className="gap-3 py-4">
              <CardContent className="flex flex-col gap-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{w.name}</p>
                    <p className="text-muted-foreground text-xs">{new Date(w.at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <AttendBadge attend={w.attend} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Hapus ucapan" className="text-muted-foreground"><Trash2 /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus ucapan dari {w.name}?</AlertDialogTitle>
                          <AlertDialogDescription>Ucapan ini hilang dari semua template undangan dan tidak bisa dikembalikan.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => remove(w.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{w.msg}</p>
                {w.sticker && <img src={`/adat-jawa/${w.sticker}`} alt="stiker" width="56" height="56" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
