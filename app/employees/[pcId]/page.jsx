'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/common/Navigation';
import DayPicker from '../../components/common/DayPicker';
import { lastNDays } from '../../lib/dateUtils';

const STATUS_BADGE = { ONLINE: 'badge-success', IDLE: 'badge-warning', OFFLINE: 'badge-danger' };
const STATUS_LABEL = { ONLINE: 'Working', IDLE: 'Idle', OFFLINE: 'No signal' };
const SEVERITY_BADGE = { HIGH: 'badge-danger', MEDIUM: 'badge-warning', LOW: 'badge-info' };

function fmtMins(mins) {
  const m = Math.round(mins || 0);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

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

// Next 14 (the version in this repo's package.json) passes `params` as a
// plain object, not a Promise — no React.use() needed. If this project is
// ever upgraded to Next 15, params becomes a Promise and this line needs
// `use(params)` from 'react' instead.
export default function EmployeeProfilePage({ params }) {
  const { pcId } = params;
  const days = useMemo(() => lastNDays(30), []);
  const todayStr = days[0].date;

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const isToday = selectedDate === todayStr;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = isToday ? `/api/employees/${pcId}` : `/api/employees/${pcId}?date=${selectedDate}`;
        const res = await fetch(url);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Request failed');
        if (!cancelled) {
          setProfile(body);
          setError(null);
          setLastFetchedAt(new Date());
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    setProfile(null); // clear stale data from the previous day while the new one loads
    load();

    // Only a closed, finished day can never change — no point polling it.
    // Today is still live, so keep refreshing, and re-check the moment the
    // tab regains focus (a backgrounded tab's interval gets throttled by
    // the browser, so relying on the timer alone can leave you looking at
    // something stale for far longer than 30 seconds without noticing).
    if (!isToday) return () => { cancelled = true; };

    const timer = setInterval(load, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [pcId, selectedDate, isToday]);

  const dayLabel = days.find((d) => d.date === selectedDate)?.label || selectedDate;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/employees" className="text-sm text-blue-600 hover:text-blue-700">← All employees</Link>
          {lastFetchedAt && (
            <p className="text-xs text-gray-400">Updated {fmtClock(lastFetchedAt)}</p>
          )}
        </div>

        <div className="mt-4">
          <DayPicker days={days} selected={selectedDate} onSelect={setSelectedDate} />
        </div>

        {error && (
          <div className="card border-l-4 border-red-500 bg-red-50 mt-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {!profile && !error && <p className="text-gray-500 mt-6">Loading {dayLabel.toLowerCase()}...</p>}

        {profile && (
          <>
            {/* Header */}
            <div className="card mt-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400">
                    {profile.pcId}{profile.shiftKind ? ` · ${profile.shiftKind}` : ''} · {dayLabel}
                  </p>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.employee}</h1>
                  <p className="text-gray-600 mt-1">
                    {profile.department} · {profile.location} · {profile.shiftLabel}
                    {profile.isOffDay && ' · off day'}
                  </p>
                </div>
                {isToday ? (
                  <span className={STATUS_BADGE[profile.status] || 'badge-danger'}>
                    {STATUS_LABEL[profile.status] || profile.status}
                  </span>
                ) : (
                  <span className="badge-info">Closed day</span>
                )}
              </div>

              {profile.currentTitle && (
                <p className="mt-4 text-sm text-gray-700">
                  Currently: <span className="font-medium">{profile.currentTitle}</span>
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <Stat label="Active" value={fmtMins(profile.today.activeMins)} />
                <Stat label="Idle" value={fmtMins(profile.today.idleMins)} />
                <Stat label="Non-work" value={fmtMins(profile.today.nonWorkMins)} accent={profile.today.nonWorkMins > 30 ? 'text-red-600' : ''} />
                <Stat label="Alerts" value={profile.today.alertsCount} accent={profile.today.alertsCount > 0 ? 'text-red-600' : ''} />
              </div>
            </div>

            {!isToday && !profile.hasReport && (
              <div className="card border-l-4 border-gray-300 bg-gray-50 mt-6">
                <p className="text-gray-600 text-sm">No report was recorded for this day.</p>
              </div>
            )}

            {!isToday && profile.hasReport && profile.today.activeMins === 0 && profile.today.idleMins === 0 && !profile.dailyReport?.notes && (
              <div className="card border-l-4 border-gray-300 bg-gray-50 mt-6">
                <p className="text-gray-600 text-sm">
                  A report exists for this day, but no activity was tracked — the PC wasn't used, or the
                  monitoring agent wasn't running that day.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Screen time */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  What was used, and for how long
                </h2>
                {profile.screenTime.topSites.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    {isToday ? 'Nothing tracked yet today.' : 'Nothing tracked this day.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {profile.screenTime.topSites.map((site) => (
                      <div key={site.name} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 truncate text-sm text-gray-700" title={site.name}>
                          {site.name}
                        </span>
                        <span className="h-2 flex-1 rounded bg-gray-100 overflow-hidden">
                          <span
                            className={`block h-2 rounded ${site.type === 'non-work' ? 'bg-red-400' : site.type === 'work' ? 'bg-blue-500' : 'bg-gray-400'}`}
                            style={{ width: `${Math.max(4, site.percent)}%` }}
                          />
                        </span>
                        <span className="w-16 shrink-0 text-right text-sm text-gray-500">{fmtMins(site.mins)}</span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 pt-2">
                      {profile.screenTime.totalHours} hours tracked {isToday ? 'today' : 'this day'}
                    </p>
                  </div>
                )}
              </div>

              {/* Alerts */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Alerts</h2>
                  <Link
                    href={`/alerts?seatId=${profile.seatId}${isToday ? '' : `&date=${selectedDate}`}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View all →
                  </Link>
                </div>
                {profile.alerts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No alerts for this employee{isToday ? ' today' : ' this day'}.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {profile.alerts.slice(0, 10).map((alert) => (
                      <div key={alert._id || alert.timestamp} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">{alert.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {fmtWhen(alert.timestamp)} · {alert.acknowledged ? 'acknowledged' : 'open'}
                          </p>
                        </div>
                        <span className={SEVERITY_BADGE[alert.severity] || 'badge-info'}>{alert.severity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Daily report — available for today only once the 6pm job has run;
                available for any past day, since it's already closed */}
            {profile.dailyReport && (
              <div className="card mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {isToday ? "Today's report" : 'Report'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat label="Productivity score" value={`${profile.dailyReport.productivityScore}%`} />
                  <Stat label="Overall" value={profile.dailyReport.overallStatus} />
                  <Stat label="Active" value={fmtMins(profile.dailyReport.totalActiveMins)} />
                  <Stat label="Non-work" value={fmtMins(profile.dailyReport.nonWorkMins)} />
                </div>
                {profile.dailyReport.notes && (
                  <p className="text-xs text-amber-600 mt-4">{profile.dailyReport.notes}</p>
                )}
              </div>
            )}

            {/* Recent activity timeline — today only; a full past day's raw
                log is long and adds little over the report + alerts above */}
            {isToday && (
              <div className="card mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent activity</h2>
                {profile.recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm">No activity logs yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {profile.recentActivity.slice(0, 15).map((log, i) => (
                      <div key={i} className="flex items-center gap-4 py-2 text-sm">
                        <span className="w-12 shrink-0 text-gray-400">{fmtWhen(log.timestamp).split(' ')[0]}</span>
                        <span className="flex-1 truncate text-gray-700">{log.currentTab?.title || '—'}</span>
                        <span className="shrink-0 text-gray-400">{Math.round(log.activeMins || 0)}m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, accent = '' }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold text-gray-900 ${accent}`}>{value}</p>
    </div>
  );
}
