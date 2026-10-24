'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Navigation from '../common/Navigation';

const links = [
  ['/attendance/manager', 'Today'],
  ['/attendance/manager/leaves', 'Leave requests'],
  ['/attendance/manager/map', 'Live map'],
  ['/attendance', 'Attendance overview'],
];

export default function ManagerNav() {
  const pathname = usePathname();
  return <>
    <Navigation />
    <nav aria-label="Attendance manager" className="bg-paper border-b border-line">
      <div className="container mx-auto px-4 flex flex-wrap gap-1 py-2">
        {links.map(([href, label]) => <Link key={href} href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={pathname === href ? 'btn-primary' : 'btn-secondary'}>{label}</Link>)}
      </div>
    </nav>
  </>;
}
