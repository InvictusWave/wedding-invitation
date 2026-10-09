'use client';

// Watermelon UI "macos-sidebar" (https://ui.watermelon.sh), adapted: items are page links,
// the selected item follows the current route, and it collapses to icons.
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { PanelLeft } from 'lucide-react';
import { useState } from 'react';
import { go, isActive } from '@/app/admin/nav';

export function MacOSSidebar({ items, header, footer, defaultOpen = true, children, className = '' }) {
  const path = usePathname();
  const [hovered, setHovered] = useState(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-muted relative flex min-h-svh w-full ${className}`}>
      <motion.aside
        animate={{ width: isOpen ? 240 : 64 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.7 }}
        className={`sticky top-0 hidden h-svh shrink-0 flex-col p-2 md:flex ${isOpen ? 'bg-background' : 'bg-transparent'} transition-colors duration-700`}
      >
        <div className={`flex w-full items-center p-2 ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="min-w-0 truncate">
                {header}
              </motion.div>
            )}
          </AnimatePresence>
          <button type="button" onClick={() => setIsOpen(!isOpen)} aria-label="Ciutkan menu" className="text-muted-foreground hover:text-foreground shrink-0">
            <PanelLeft className="size-5" />
          </button>
        </div>

        <nav className="mt-4 flex w-full flex-col gap-1" onMouseLeave={() => setHovered(null)}>
          {items.map(({ label, href, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <a key={href} href={href} onClick={go} title={label} onMouseEnter={() => setHovered(href)}
                className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 whitespace-nowrap">
                {active && <motion.span layoutId="sidebar-active" className="bg-accent absolute inset-0 rounded-lg" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                {hovered === href && !active && (
                  <motion.span layoutId="sidebar-hover" className="bg-accent/50 absolute inset-0 rounded-lg"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                )}
                <Icon className={`relative size-5 shrink-0 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
                <AnimatePresence>
                  {isOpen && (
                    <motion.span initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.2 }}
                      className={`relative tracking-tight ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto w-full">{isOpen && footer}</div>
      </motion.aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
