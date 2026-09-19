'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/shipments', label: 'Shipments' },
  { href: '/module4', label: 'Monitoring' },
  { href: '/employees', label: 'Employees' },
  { href: '/attendance', label: 'Attendance' },
  { href: '/alerts', label: 'Alerts' },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav className="bg-ink sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-6 bg-signal" />
            <span className="font-display font-semibold text-base text-paper tracking-tight">MAFHH AVIATION</span>
          </Link>

          <div className="hidden md:flex items-center h-full">
            {LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} active={isActive(link.href)}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="hidden md:block text-xs font-medium text-slate-light hover:text-paper transition-colors"
            >
              Sign out
            </button>
            <button className="md:hidden p-2 text-paper" onClick={() => setIsOpen(!isOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {LINKS.map((link) => (
              <MobileNavLink key={link.href} href={link.href} active={isActive(link.href)} onClick={() => setIsOpen(false)}>
                {link.label}
              </MobileNavLink>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-light"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }) {
  return (
    <Link href={href} className="h-full flex items-center">
      <span
        className={`h-full flex items-center px-4 text-sm font-medium border-b-2 transition-colors ${
          active ? 'text-paper border-signal' : 'text-slate-light border-transparent hover:text-paper'
        }`}
      >
        {children}
      </span>
    </Link>
  );
}

function MobileNavLink({ href, active, onClick, children }) {
  return (
    <Link href={href} onClick={onClick}>
      <span className={`block px-3 py-2 text-sm font-medium ${active ? 'text-paper border-l-2 border-signal pl-2.5' : 'text-slate-light'}`}>
        {children}
      </span>
    </Link>
  );
}
