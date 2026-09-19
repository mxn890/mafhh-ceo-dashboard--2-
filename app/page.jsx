'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from './components/common/Navigation';

function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
}

export default function Homepage() {
  const [pc, setPc] = useState(null);
  const [shipments, setShipments] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loadErrors, setLoadErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function safeLoad(key, url, onData) {
      try {
        const res = await fetch(url);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Request failed');
        if (!cancelled) onData(body);
      } catch (err) {
        if (!cancelled) setLoadErrors((prev) => ({ ...prev, [key]: err.message }));
      }
    }

    safeLoad('pc', '/api/pc-monitoring', (body) => setPc(body));
    safeLoad('shipments', '/api/shipments', (body) => setShipments(body.summary));
    safeLoad('employees', '/api/employees', (body) => setEmployeeCount(body.employees?.length ?? 0));
    safeLoad('alerts', '/api/alerts', (body) => setAlerts(body.alerts?.slice(0, 6) || []));

    return () => { cancelled = true; };
  }, []);

  const tiles = [
    { label: 'PCs working now', value: pc?.summary?.online, of: pc?.summary?.total, href: '/module4', pending: !pc && !loadErrors.pc },
    { label: 'PC alerts today', value: pc?.summary?.alertsToday, href: '/module4', accent: pc?.summary?.alertsToday > 0, pending: !pc && !loadErrors.pc },
    { label: 'Shipments pending', value: shipments?.Pending, href: '/shipments', pending: !shipments && !loadErrors.shipments },
    { label: 'Shipments in transit', value: shipments?.Active, href: '/shipments', pending: !shipments && !loadErrors.shipments },
    { label: 'Employees', value: employeeCount, href: '/employees', pending: employeeCount === null && !loadErrors.employees },
  ];

  return (
    <div className="min-h-screen bg-mist">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink mb-1">Overview</h1>
          <p className="text-sm text-slate">Live across PC monitoring, shipments and employees</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-line mb-8">
          {tiles.map((t) => (
            <Link key={t.label} href={t.href} className="bg-paper p-5 hover:bg-mist transition-colors block">
              <p className="text-xs text-slate mb-2">{t.label}</p>
              {t.pending ? (
                <p className="font-tabular text-2xl text-slate-light">···</p>
              ) : (
                <p className={`font-display font-tabular text-3xl font-semibold ${t.accent ? 'text-signal' : 'text-ink'}`}>
                  {t.value ?? '—'}{t.of ? <span className="text-base text-slate-light">/{t.of}</span> : ''}
                </p>
              )}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h2 className="font-display text-base font-semibold text-ink mb-4">Recent alerts</h2>
            {loadErrors.alerts && <p className="text-sm text-signal">{loadErrors.alerts}</p>}
            {!alerts && !loadErrors.alerts && <p className="text-sm text-slate-light">Loading…</p>}
            {alerts && alerts.length === 0 && <p className="text-sm text-slate-light">No recent alerts.</p>}
            {alerts && alerts.length > 0 && (
              <div className="divide-y divide-line">
                {alerts.map((a) => (
                  <div key={a._id || a.timestamp} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{a.message}</p>
                      <p className="text-xs text-slate-light mt-0.5">{timeAgo(a.timestamp)}</p>
                    </div>
                    <span className={a.severity === 'HIGH' || a.severity === 'high' ? 'badge-danger' : 'badge-warning'}>
                      {a.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-display text-base font-semibold text-ink mb-4">Quick access</h2>
            <div className="space-y-1">
              <QuickLink href="/module4" label="PC Monitoring" />
              <QuickLink href="/employees" label="Employees" />
              <QuickLink href="/attendance" label="Attendance" />
              <QuickLink href="/shipments" label="Shipments" />
              <QuickLink href="/alerts" label="All alerts" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickLink({ href, label }) {
  return (
    <Link href={href} className="flex items-center justify-between px-3 py-2.5 border border-line hover:border-ink transition-colors">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="text-slate-light">→</span>
    </Link>
  );
}
