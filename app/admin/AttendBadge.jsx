import { Badge } from '@/components/ui/badge';

const STYLE = {
  Hadir: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'Tidak Hadir': 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  'Ragu-ragu': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export const AttendBadge = ({ attend }) => <Badge variant="secondary" className={STYLE[attend]}>{attend}</Badge>;
