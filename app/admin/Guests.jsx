'use client';
import { startTransition, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import { Plus, Search, Send, Copy, Trash2, Contact, FileSpreadsheet, MessageSquareText, Check, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { addGuests, markSent, deleteGuest, updateGuestSchedule } from './actions';
import { fromText, fromRows, fromVcf, loadXlsx, downloadTemplate } from './import';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

const DEFAULT_TPL = `Kepada Yth.
Bapak/Ibu/Saudara/i
*{nama}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.

Berikut link undangan kami untuk info lengkap acara:
{link}

Jadwal: {jadwal}
Tanggal & waktu: {waktu}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih.`;

// The message template is a per-device convenience, so it lives in localStorage.
const store = {
  get: k => { try { return localStorage.getItem('adm:' + k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem('adm:' + k, v); } catch {} },
};

const fmt = t => new Date(t).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' });
const scheduleLabel = schedule => schedule === 'sabtu' || schedule === 'banyu-mili' ? 'Sabtu' : schedule === 'wanita' ? 'Acara mempelai wanita (Sabtu)' : schedule === 'pria' ? 'Minggu' : 'Semua jadwal';
const scheduleTime = schedule => schedule === 'pria'
  ? 'Minggu, 1 November 2026 · 09.00 WIB'
  : schedule === 'sabtu' || schedule === 'banyu-mili'
    ? 'Sabtu, 31 Oktober 2026 · Akad 08.00 WIB · Banyu Mili 13.00–21.00 WIB'
    : schedule === 'wanita'
      ? 'Sabtu, 31 Oktober 2026 · Akad 08.00 WIB · Resepsi 10.00 WIB'
      : 'Sabtu, 31 Oktober 2026 · Akad 08.00 WIB; Minggu, 1 November 2026 · 09.00 WIB';

function AddGuests() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [canPick, setCanPick] = useState(false);
  const [schedule, setSchedule] = useState('semua');
  const [busy, start] = useTransition();
  const file = useRef(null);
  useEffect(() => setCanPick('contacts' in navigator && 'select' in navigator.contacts), []); // Chrome Android only

  const save = list => start(async () => {
    const { added } = await addGuests(list.map(g => ({ ...g, schedule })));
    const skipped = list.length - added;
    toast.success(`${added} tamu ditambahkan`, { description: skipped ? `${skipped} dilewati (kosong atau sudah ada)` : undefined });
    setText('');
    setOpen(false);
  });

  const onFile = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      if (/\.vcf$/i.test(f.name)) return save(fromVcf(await f.text()));
      const X = await loadXlsx();
      const wb = X.read(await f.arrayBuffer());
      save(fromRows(X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false })));
    } catch {
      toast.error('Gagal membaca file', { description: 'Pastikan formatnya .xlsx, .csv, atau .vcf.' });
    }
  };

  const pick = async () => {
    try {
      const picked = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      save(picked.map(c => ({ name: (c.name?.[0] || '').trim(), phone: c.tel?.[0] || '' })));
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus /> Tambah tamu</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah tamu</DialogTitle>
          <DialogDescription>Satu tamu per baris, nomor WA opsional: <code className="text-foreground">Keluarga Pak Slamet | 0812…</code></DialogDescription>
        </DialogHeader>
        <Textarea rows={6} value={text} onChange={e => setText(e.target.value)} placeholder={'Hasan dan Pasangan | 081234567890\nRekan Kantor'} />
        <label className="grid gap-1 text-sm font-medium">Jadwal yang ditampilkan
          <NativeSelect value={schedule} onChange={e => setSchedule(e.target.value)} className="w-full">
            <NativeSelectOption value="semua">Semua jadwal (Akad + Minggu)</NativeSelectOption>
            <NativeSelectOption value="wanita">Mempelai wanita (Sabtu)</NativeSelectOption>
            <NativeSelectOption value="pria">Mempelai pria / ngunduh mantu (Minggu)</NativeSelectOption>
            <NativeSelectOption value="sabtu">Sabtu (Akad + Banyu Mili)</NativeSelectOption>
            <NativeSelectOption value="banyu-mili">Pria / Ngunduh Mantu Banyu Mili (Sabtu)</NativeSelectOption>
          </NativeSelect>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {canPick && <Button variant="outline" disabled={busy} onClick={pick}><Contact /> Pilih dari kontak HP</Button>}
          <Button variant="outline" disabled={busy} onClick={() => file.current.click()} className={canPick ? '' : 'sm:col-span-2'}><FileSpreadsheet /> Import Excel / CSV / vCard</Button>
          <input ref={file} type="file" accept=".xlsx,.xls,.csv,.vcf" hidden onChange={onFile} />
        </div>
        <p className="text-muted-foreground text-xs">
          Excel: <button type="button" className="text-foreground inline-flex items-center gap-1 font-medium underline underline-offset-2" onClick={downloadTemplate}><Download className="size-3" /> download template</button>, isi kolom Nama &amp; Nomor WA (ganti baris contoh), lalu import. iPhone: bagikan kontak sebagai .vcf lalu import.
        </p>
        <DialogFooter>
          <Button disabled={busy || !text.trim()} onClick={() => save(fromText(text))}>{busy && <Spinner />} Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateDialog({ tpl, setTpl }) {
  const update = v => { setTpl(v); store.set('tpl', v); };
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline"><MessageSquareText /> Teks pesan</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Teks pesan WhatsApp</DialogTitle>
          <DialogDescription><code className="text-foreground">{'{nama}'}</code>, <code className="text-foreground">{'{link}'}</code>, dan <code className="text-foreground">{'{jadwal}'}</code> diganti otomatis. Tersimpan di perangkat ini.</DialogDescription>
        </DialogHeader>
        <Textarea rows={14} value={tpl} onChange={e => update(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => update(DEFAULT_TPL)}>Kembalikan bawaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteGuest({ guest, onDelete }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label={`Hapus ${guest.name}`} className="text-muted-foreground"><Trash2 /></Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {guest.name}?</AlertDialogTitle>
          <AlertDialogDescription>Tamu ini dihapus dari daftar. Ucapan yang sudah dikirimnya tetap ada.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => onDelete(guest)}>Hapus</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Guests({ theme, guests: saved }) {
  // Show changes at once; the server catches up in the background and revalidates.
  const [guests, apply] = useOptimistic(saved, (list, a) =>
    a.del ? list.filter(g => g.id !== a.id) : list.map(g => (g.id === a.id ? { ...g, ...(a.schedule ? { schedule: a.schedule } : { sent_at: Date.now() }) } : g)));
  const remove = g => startTransition(async () => { apply({ del: true, id: g.id }); toast(`${g.name} dihapus`); await deleteGuest(g.id); });
  const sendMark = g => startTransition(async () => { apply({ id: g.id }); await markSent(g.id); });
  const [tpl, setTpl] = useState(DEFAULT_TPL);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('semua');
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    setTpl(store.get('tpl') || DEFAULT_TPL);
    setOrigin(location.origin);
  }, []);

  const linkFor = (name, schedule) => `${origin}/${theme}/?to=${encodeURIComponent(name).replace(/%20/g, '+')}${schedule && schedule !== 'semua' ? `&jadwal=${schedule}` : ''}`;
  const messageFor = g => {
    let text = tpl.replaceAll('{nama}', g.name).replaceAll('{link}', linkFor(g.name, g.schedule)).replaceAll('{jadwal}', scheduleLabel(g.schedule)).replaceAll('{waktu}', scheduleTime(g.schedule));
    if (!tpl.includes('{jadwal}')) text += `\n\nJadwal: ${scheduleLabel(g.schedule)}`;
    if (!tpl.includes('{waktu}')) text += `\nTanggal & waktu: ${scheduleTime(g.schedule)}`;
    return text;
  };

  const shown = useMemo(() => guests.filter(g =>
    (filter === 'semua' || (filter === 'terkirim') === !!g.sent_at) &&
    (g.name.toLowerCase().includes(q.toLowerCase()) || g.phone.includes(q))
  ), [guests, q, filter]);
  const sent = guests.filter(g => g.sent_at).length;

  const copy = async g => {
    await navigator.clipboard.writeText(messageFor(g));
    setCopied(g.id);
    toast.success('Pesan disalin', { description: g.name });
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Tamu</h1>
          <p className="text-muted-foreground text-sm">{guests.length} tamu · {sent} terkirim · link memakai template <span className="text-foreground font-medium">{theme}</span></p>
        </div>
        <div className="flex gap-2">
          <TemplateDialog tpl={tpl} setTpl={setTpl} />
          <AddGuests />
        </div>
      </div>

      {guests.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Contact /></EmptyMedia>
            <EmptyTitle>Belum ada tamu</EmptyTitle>
            <EmptyDescription>Tambahkan manual, dari kontak HP, atau import file Excel.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative sm:w-72">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input className="pl-8" type="search" placeholder="Cari nama / nomor" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList>
                  <TabsTrigger value="semua">Semua</TabsTrigger>
                  <TabsTrigger value="belum">Belum</TabsTrigger>
                  <TabsTrigger value="terkirim">Terkirim</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Table className="min-w-[900px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[33%] pl-4">Nama</TableHead>
                  <TableHead className="hidden w-[22%] sm:table-cell">Status</TableHead>
                  <TableHead className="w-[25%]">Jadwal</TableHead>
                  <TableHead className="w-[20%] pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="max-w-0 pl-4 whitespace-normal">
                      <p className="font-medium break-words">{g.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {g.phone ? `+${g.phone}` : 'tanpa nomor'} · {g.schedule === 'wanita' ? 'mempelai wanita' : g.schedule === 'pria' ? 'mempelai pria' : g.schedule === 'banyu-mili' ? 'Banyu Mili' : 'semua jadwal'}
                        <span className="sm:hidden">{g.sent_at ? ` · terkirim ${fmt(g.sent_at)}` : ''}</span>
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {g.sent_at
                        ? <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Terkirim {fmt(g.sent_at)}</Badge>
                        : <Badge variant="outline">Belum dikirim</Badge>}
                    </TableCell>
                    <TableCell>
                      <NativeSelect value={g.schedule || 'semua'} onChange={e => startTransition(async () => { apply({ id: g.id, schedule: e.target.value }); await updateGuestSchedule(g.id, e.target.value); })} className="w-full max-w-40">
                        <NativeSelectOption value="semua">Semua (Akad + Minggu)</NativeSelectOption>
                        <NativeSelectOption value="wanita">Wanita</NativeSelectOption>
                        <NativeSelectOption value="pria">Pria / Minggu</NativeSelectOption>
                        <NativeSelectOption value="sabtu">Sabtu / Akad + Banyu</NativeSelectOption>
                        <NativeSelectOption value="banyu-mili">Banyu Mili / Sabtu</NativeSelectOption>
                      </NativeSelect>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild aria-label={`Buka undangan ${g.name}`} title="Buka undangan">
                          <a target="_blank" rel="noopener" href={linkFor(g.name, g.schedule)}><ExternalLink /></a>
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Salin pesan" onClick={() => copy(g)}>{copied === g.id ? <Check /> : <Copy />}</Button>
                        {g.phone ? <Button size="sm" aria-label="Kirim WhatsApp" asChild variant={g.sent_at ? 'outline' : 'default'} className={g.sent_at ? '' : 'bg-[#1fa855] text-white hover:bg-[#1a9049]'}>
                          <a target="_blank" rel="noopener" href={`https://wa.me/${g.phone}?text=${encodeURIComponent(messageFor(g))}`} onClick={() => sendMark(g)}>
                            <Send /> <span className="hidden sm:inline">{g.sent_at ? 'Kirim lagi' : 'Kirim WA'}</span>
                          </a>
                        </Button> : <span className="text-muted-foreground px-2 text-xs">Tanpa WA</span>}
                        <DeleteGuest guest={g} onDelete={remove} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {shown.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-muted-foreground py-10 text-center">Tidak ada tamu yang cocok.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
