import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = { title: 'Ammar & Yulia — The Wedding', description: 'Undangan pernikahan Ammar dan Yulia' };

export default function RootLayout({ children }) {
  return <html lang="id" className={cn("font-sans", geist.variable)}><body>{children}</body></html>;
}
