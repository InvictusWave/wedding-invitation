'use client';
import { useOptimistic, useTransition } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { setTheme } from './actions';

const LABEL = { 'jawa-red-art': 'Jawa Red Art', 'adat-jawa': 'Adat Jawa', 'jawa-classic-foto': 'Jawa Classic Foto' };

export default function ThemePicker({ themes, current }) {
  const [shown, setShown] = useOptimistic(current);
  const [, start] = useTransition();
  const pick = t => start(async () => {
    setShown(t);
    await setTheme(t);
    toast.success(`Template diganti ke ${LABEL[t] || t}`);
  });

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {themes.map(t => {
        const on = t === shown;
        return (
          <div key={t} className={`group relative overflow-hidden rounded-xl border transition-all ${on ? 'ring-primary border-transparent ring-2' : 'hover:border-foreground/30'}`}>
            <button type="button" onClick={() => pick(t)} className="block w-full text-left">
              <img src={`/${t}/img/og.jpg`} alt="" className="aspect-[1200/630] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="flex items-center justify-between gap-2 p-3 text-sm font-medium">
                {LABEL[t] || t}
                {on && <span className="bg-primary text-primary-foreground grid size-5 place-items-center rounded-full"><Check className="size-3" /></span>}
              </span>
            </button>
            <a href={`/${t}/`} target="_blank" className="bg-background/90 text-muted-foreground hover:text-foreground absolute top-2 right-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs shadow-sm">
              <ExternalLink className="size-3" /> Pratinjau
            </a>
          </div>
        );
      })}
    </div>
  );
}
