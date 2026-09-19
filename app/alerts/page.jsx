'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../components/common/Navigation';
import DayPicker from '../components/common/DayPicker';
import { lastNDays } from '../lib/dateUtils';

const SEVERITY_BADGE = { HIGH: 'badge-danger', MEDIUM: 'badge-warning', LOW: 'badge-info' };

function fmtWhen(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString('en-GB', {
    timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false,
    day: '2-digit', month: 'short',
  });
}

function fmtClock(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// Next's app router requires useSearchParams() to sit inside a Suspense
// boundary, or the build fails during static prerendering. AlertsPage stays
// the default export (so the route file is unchanged apart from this split);
// all the real logic moves to AlertsView underneath it.
export default function AlertsPage() {
  return (
    <Suspense fallback={<AlertsFallback />}>
      <AlertsView />
    </Suspense>
  );
}

function AlertsFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Loading alerts...</p>
      </main>
    </div>
  );
}

function AlertsView() {
  const searchParams = useSearchParams();
  const pcFilter = searchParams.get('pcId') || '';
  const seatFilter = searchParams.get('seatId') || '';
  const days = useMemo(() => lastNDays(30), []);
  const todayStr = days[0].date;

  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || todayStr);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);
  const [severity, setSeverity] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [acking, setAcking] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const isToday = selectedDate === todayStr;

  async function load() {
    try {
      const qs = new URLSearchParams();
      if (pcFilter) qs.set('pcId', pcFilter);
      if (seatFilter) qs.set('seatId', seatFilter);
      qs.set('date', selectedDate);
      const res = await fetch(`/api/alerts?${qs}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Request failed');
      setAlerts(body.alerts);
      setError(null);
      setLastFetchedAt(new Date());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    setAlerts(null);
    load();

    // Same reasoning as the employee profile page: a closed day can't
    // change, so only poll — and only react to the tab regaining focus —
    // while looking at today.
    if (!isToday) return undefined;

    const timer = setInterval(load, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pcFilter, seatFilter, selectedDate, isToday]);

  const visible = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((a) => {
      if (severity !== 'all' && a.severity !== severity) return false;
      if (onlyOpen && a.acknowledged) return false;
      return true;
    });
  }, [alerts, severity, onlyOpen]);

  async function acknowledge(alertId) {
    setAcking(alertId);
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, acknowledgedBy: 'CEO Dashboard' }),
      });
      await load();
    } finally {
      setAcking(null);
    }
  }

  const dayLabel = days.find((d) => d.date === selectedDate)?.label || selectedDate;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Alerts</h1>
            <p className="text-gray-600">
              {(pcFilter || seatFilter) ? (
                <>Showing alerts for {pcFilter || seatFilter} · <Link href="/alerts" className="text-blue-600 hover:text-blue-700">clear filter</Link></>
              ) : (
                `${dayLabel}'s alerts, most recent first`
              )}
            </p>
          </div>
          {lastFetchedAt && <p className="text-xs text-gray-400">Updated {fmtClock(lastFetchedAt)}</p>}
        </div>

        <DayPicker days={days} selected={selectedDate} onSelect={setSelectedDate} />

        {error && (
          <div className="card border-l-4 border-red-500 bg-red-50 mt-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-6 mb-6">
          {['all', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={s === severity ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            >
              {s === 'all' ? 'All severities' : s}
            </button>
          ))}
          <button
            onClick={() => setOnlyOpen((v) => !v)}
            className={onlyOpen ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            Open only
          </button>
        </div>

        {!alerts && !error && <p className="text-gray-500">Loading {dayLabel.toLowerCase()}...</p>}

        {alerts && visible.length === 0 && (
          <p className="text-gray-500">
            {alerts.length === 0 ? `No alerts on ${dayLabel.toLowerCase()}.` : 'No alerts match this filter.'}
          </p>
        )}

        {alerts && visible.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">When</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">PC / Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Message</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visible.map((alert) => (
                  <tr key={alert._id || `${alert.pcId}-${alert.timestamp}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtWhen(alert.timestamp)}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/employees/${alert.seatId || alert.pcId}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {alert.pcId}
                      </Link>
                      <span className="text-gray-500"> · {alert.employee}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{alert.message}</td>
                    <td className="px-6 py-4">
                      <span className={SEVERITY_BADGE[alert.severity] || 'badge-info'}>{alert.severity}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {alert.acknowledged ? (
                        <span className="text-gray-500">acknowledged</span>
                      ) : (
                        <span className="text-orange-600 font-medium">open</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledge(alert._id)}
                          disabled={acking === alert._id}
                          className="btn-secondary btn-sm"
                        >
                          {acking === alert._id ? 'Saving...' : 'Acknowledge'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
