'use client';

import { useCallback, useMemo, useState } from 'react';
import Navigation from '../components/common/Navigation';
import PCCard from '../components/module4/PCCard';
import { useLivePolling } from '../lib/useLivePolling';

const FILTERS = [
  { key: 'all', label: 'All PCs' },
  { key: 'ONLINE', label: 'Working' },
  { key: 'IDLE', label: 'Idle' },
  { key: 'OFFLINE', label: 'No signal' },
  { key: 'alerts', label: 'With alerts' },
];

function fmtClock(date) {
  if (!date) return null;
  return date.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function Module4Page() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/pc-monitoring');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Request failed');
      setSnapshot(body);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const lastFetchedAt = useLivePolling(load);

  const visible = useMemo(() => {
    if (!snapshot) return [];
    const needle = query.trim().toLowerCase();
    return snapshot.pcs.filter((pc) => {
      const matchesFilter =
        filter === 'all' ? true : filter === 'alerts' ? pc.alertsToday > 0 : pc.status === filter;
      const matchesQuery =
        !needle ||
        pc.employee.toLowerCase().includes(needle) ||
        pc.pcId.toLowerCase().includes(needle) ||
        pc.department.toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [snapshot, filter, query]);

  return (
    <div className="min-h-screen bg-mist">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink mb-1">PC Monitoring</h1>
            <p className="text-sm text-slate">
              {snapshot ? `${snapshot.summary.total} machines, live from the monitoring server` : 'Connecting…'}
              {lastFetchedAt && ` · updated ${fmtClock(lastFetchedAt)}`}
            </p>
          </div>
          <button onClick={load} className="btn-secondary btn-sm">Refresh now</button>
        </div>

        {error && (
          <div className="card border-l-2 border-signal bg-signal-light mb-6">
            <p className="text-signal text-sm">
              {error} — confirm <span className="font-tabular">pm2 status mafhh-module4</span> on the VPS.
            </p>
          </div>
        )}

        {snapshot && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-line mb-6">
            {[
              ['Working', snapshot.summary.online],
              ['Idle', snapshot.summary.idle],
              ['No signal', snapshot.summary.offline],
              ['Alerts today', snapshot.summary.alertsToday],
              ['High severity', snapshot.summary.highAlertsToday],
            ].map(([label, value]) => (
              <div key={label} className="bg-paper text-center py-4">
                <p className="text-xs text-slate mb-1">{label}</p>
                <p className="font-tabular text-2xl font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={f.key === filter ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee, PC or department"
            className="ml-auto w-full sm:w-72 border border-line px-3 py-1.5 text-sm bg-paper focus:border-ink focus:outline-none"
          />
        </div>

        {!snapshot && !error && <p className="text-slate text-sm">Loading machines…</p>}

        {snapshot && visible.length === 0 && (
          <p className="text-slate text-sm">No machines match this view.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((pc) => (
            <PCCard key={pc.pcId} pc={pc} />
          ))}
        </div>
      </main>
    </div>
  );
}
