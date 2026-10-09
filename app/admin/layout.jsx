import { isAdmin } from '../../lib/auth';
import { Toaster } from '@/components/ui/sonner';
import LoginForm from './LoginForm';
import AdminShell from './AdminShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Undangan', robots: { index: false } };

export default async function AdminLayout({ children }) {
  if (!(await isAdmin())) return <LoginForm />;
  return (
    <>
      <AdminShell>{children}</AdminShell>
      <Toaster position="top-center" richColors />
    </>
  );
}
