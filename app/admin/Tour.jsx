'use client';
import { useEffect, useState } from 'react';
import { HeartHandshake, Palette, UserPlus, MessageSquareText, Send, MessageSquareHeart, Download, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { downloadTemplate } from './import';

const STEPS = [
  { icon: HeartHandshake, title: 'Selamat datang', text: 'Di sini Anda mengatur undangan Ammar & Yulia: daftar tamu, kirim undangan lewat WhatsApp, dan membaca ucapan. Ikuti panduan singkat ini.' },
  { icon: Palette, title: '1. Pilih template', text: 'Di menu Ringkasan, pilih template undangan. Template ini dipakai untuk halaman utama dan semua link yang dikirim ke tamu.' },
  { icon: UserPlus, title: '2. Tambah tamu', text: 'Buka menu Tamu → Tambah tamu. Ketik nama per baris (nomor WA opsional), pilih dari kontak HP, atau import Excel: download template di bawah, isi kolom Nama & Nomor WA, lalu import.', template: true },
  { icon: MessageSquareText, title: '3. Atur teks pesan', text: 'Tombol "Teks pesan" di menu Tamu. {nama} dan {link} diganti otomatis untuk tiap tamu, jadi setiap tamu mendapat link undangan dengan namanya.' },
  { icon: Send, title: '4. Kirim undangan', text: 'Tekan "Kirim WA" di samping nama tamu: WhatsApp terbuka dengan pesan siap kirim dan tamu ditandai terkirim. Tamu tanpa nomor? Pakai tombol salin lalu tempel di aplikasi lain.' },
  { icon: MessageSquareHeart, title: '5. Pantau ucapan', text: 'Menu Ucapan berisi doa dan konfirmasi kehadiran dari tamu. Angka ringkasnya ada di menu Ringkasan.' },
];

const KEY = 'adm:tour';
let reopen = () => {};
export const openTour = () => reopen();

export default function Tour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    reopen = () => { setI(0); setOpen(true); };
    try { if (!localStorage.getItem(KEY)) setOpen(true); } catch {}
  }, []);
  const close = () => { setOpen(false); try { localStorage.setItem(KEY, '1'); } catch {} };
  const { icon: Icon, title, text, template } = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent>
        <DialogHeader>
          <div className="bg-muted mb-2 flex size-10 items-center justify-center rounded-full"><Icon className="size-5" /></div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{text}</DialogDescription>
        </DialogHeader>
        {template && <Button variant="outline" onClick={downloadTemplate}><Download /> Download template Excel</Button>}
        <div className="flex justify-center gap-1.5" aria-hidden>
          {STEPS.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'bg-foreground w-4' : 'bg-muted-foreground/30 w-1.5'}`} />)}
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          {i ? <Button variant="ghost" onClick={() => setI(i - 1)}>Kembali</Button> : <Button variant="ghost" onClick={close}>Lewati</Button>}
          <Button onClick={() => (last ? close() : setI(i + 1))}>{last ? 'Mulai' : 'Lanjut'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const TourButton = ({ compact }) => (
  <Button variant="ghost" size={compact ? 'icon' : 'sm'} className="text-muted-foreground w-full justify-start" aria-label="Panduan" onClick={openTour}>
    <CircleHelp /> {!compact && 'Panduan'}
  </Button>
);
