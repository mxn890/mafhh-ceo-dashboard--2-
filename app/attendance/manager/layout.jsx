import { redirect } from 'next/navigation';
import { getSession } from '@/app/lib/auth/jwt';

export default async function ManagerLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/attendance/manager');
  if (!['ceo', 'admin'].includes(session.role)) redirect('/attendance');
  return children;
}
