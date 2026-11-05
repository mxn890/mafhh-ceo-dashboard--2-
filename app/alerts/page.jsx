'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {formatWhen as fmtWhen,formatClock as fmtClock,formatAlertText,formatPCEmployee} from '../lib/display-format';
import {Panel,Ranking,StatGrid} from '../components/common/Analytics';
import Navigation from '../components/common/Navigation';
import {countBy,severityRows} from '../lib/dashboard-analytics';
import DayPicker from '../components/common/DayPicker';
import { lastNDays } from '../lib/dateUtils';

const SEVERITY_BADGE = { HIGH: 'badge-danger', MEDIUM: 'badge-warning', LOW: 'badge-info' };

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
  const requestVersion = useRef(0);
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
    const version = ++requestVersion.current;
    try {
      const qs = new URLSearchParams();
      if (pcFilter) qs.set('pcId', pcFilter);
      if (seatFilter) qs.set('seatId', seatFilter);
      qs.set('date', selectedDate);
      const res = await fetch(`/api/alerts?${qs}`);
      const body = await res.json();
      if (version !== requestVersion.current) return;
      if (!res.ok) throw new Error(body.error || 'Request failed');
      setAlerts(body.alerts);
      setError(null);
      setLastFetchedAt(new Date());
    } catch (err) {
      if (version === requestVersion.current) setError(err.message);
    }
  }

  useEffect(() => {
    setAlerts(null);
    load();

    // Same reasoning as the employee profile page: a closed day can't
    // change, so only poll — and only react to the tab regaining focus —
    // while looking at today.
    if (!isToday) return () => { requestVersion.current++; };

    const timer = setInterval(load, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      requestVersion.current++;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pcFilter, seatFilter, selectedDate, isToday]);

  const visible = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((a) => {
      if (severity !== 'all' && String(a.severity).toUpperCase() !== severity) return false;
      if (onlyOpen && a.acknowledged) return false;
      return true;
    });
  }, [alerts, severity, onlyOpen]);

  async function acknowledge(alertId) {
    setAcking(alertId);
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, acknowledgedBy: 'CEO Dashboard' }),
      });
      if (!response.ok) throw new Error('Could not acknowledge alert. Please retry.');
      await load();
    } catch (error) {
      setError(error.message);
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

        {alerts && <><div className="mt-6"><StatGrid items={[{label:'High severity',value:alerts.filter(a=>String(a.severity).toUpperCase()==='HIGH').length,tone:'danger'},{label:'Medium severity',value:alerts.filter(a=>String(a.severity).toUpperCase()==='MEDIUM').length},{label:'Open',value:alerts.filter(a=>!a.acknowledged).length},{label:'Acknowledged',value:alerts.filter(a=>a.acknowledged).length}]}/></div></>}
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

        {alerts && <div className="alerts-reference-layout"><Panel title={`Alerts · ${visible.length}`}><div className="approved-alert-feed">{visible.map(alert=><article className={`approved-alert-row ${String(alert.severity).toUpperCase()==='HIGH'?'high':''}`} key={alert._id||`${alert.pcId}-${alert.timestamp}`}><span className="alert-row-icon" aria-hidden="true">{String(alert.severity).toUpperCase()==='HIGH'?'△':'◷'}</span><div className="alert-row-copy"><p>{formatAlertText(alert.message)}</p><Link href={`/employees/${alert.seatId||alert.pcId}`}>{alert.pcId} · {formatPCEmployee(alert.employee,alert.pcId)}</Link></div><time>{fmtWhen(alert.timestamp)}</time><span className={SEVERITY_BADGE[String(alert.severity).toUpperCase()]||'badge-info'}>{alert.severity}</span><span className={alert.acknowledged?'acknowledged-label':'open-label'}>{alert.acknowledged?'acknowledged':'• open'}</span>{!alert.acknowledged&&<button type="button" disabled={acking===alert._id} onClick={()=>acknowledge(alert._id)} className="btn-secondary btn-sm">{acking===alert._id?'Saving…':'Acknowledge'}</button>}</article>)}</div></Panel><aside><Panel title="By severity"><Ranking rows={severityRows(visible)}/></Panel><Panel title="Alerts by PC"><Ranking rows={countBy(visible,a=>`${a.pcId||'Unassigned'} · ${formatPCEmployee(a.employee,a.pcId)}`)}/></Panel></aside></div>}
      </main>
    </div>
  );
}

