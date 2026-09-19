'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/common/Navigation';

const STATUS_BADGE = { Pending: 'badge-warning', Active: 'badge-success', Delayed: 'badge-danger', Completed: 'badge-success' };
const STATUSES = ['Pending', 'Active', 'Delayed', 'Completed'];

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

// Next 14 passes params directly, not as a Promise — see the same note on
// the employees profile page in the Module 4 dashboard.
export default function ShipmentDetailPage({ params }) {
  const { awb } = params;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  async function load() {
    try {
      const res = await fetch(`/api/shipments/${awb}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Request failed');
      setData(body);
      setNote(body.shipment.statusNote || '');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [awb]);

  async function setStatus(status) {
    setSaving(true);
    try {
      await fetch(`/api/shipments/${awb}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function resumeAutomation() {
    setSaving(true);
    try {
      await fetch(`/api/shipments/${awb}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeAutomation: true }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  const shipment = data?.shipment;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <Link href="/shipments" className="text-sm text-blue-600 hover:text-blue-700">← All shipments</Link>

        {error && (
          <div className="card border-l-4 border-red-500 bg-red-50 mt-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {!shipment && !error && <p className="text-gray-500 mt-6">Loading...</p>}

        {shipment && (
          <>
            <div className="card mt-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400">AWB</p>
                  <h1 className="text-3xl font-bold text-gray-900">{shipment.awb}</h1>
                </div>
                <span className={STATUS_BADGE[shipment.status] || 'badge-info'}>{shipment.status}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div><p className="text-xs text-gray-500">Flight</p><p className="font-semibold text-gray-900">{shipment.flightNumber || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Route</p><p className="font-semibold text-gray-900">{shipment.origin && shipment.destination ? `${shipment.origin} → ${shipment.destination}` : '—'}</p></div>
                <div><p className="text-xs text-gray-500">Date</p><p className="font-semibold text-gray-900">{fmtDateTime(shipment.flightDate)?.split(',')[0]}</p></div>
                <div><p className="text-xs text-gray-500">Weight / Pieces</p><p className="font-semibold text-gray-900">{shipment.weightRaw || '—'} / {shipment.pieces || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Commodity</p><p className="font-semibold text-gray-900">{shipment.commodity || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Booking status</p><p className="font-semibold text-gray-900">{shipment.bookingStatus}</p></div>
                <div><p className="text-xs text-gray-500">Flight status</p><p className="font-semibold text-gray-900">{shipment.flightStatus}</p></div>
                <div><p className="text-xs text-gray-500">Last flight check</p><p className="font-semibold text-gray-900">{fmtDateTime(shipment.lastFlightCheckAt)}</p></div>
              </div>

              {shipment.delayMinutes !== null && shipment.delayMinutes !== undefined && (
                <p className="mt-4 text-sm text-red-600 font-medium">Delay: {shipment.delayMinutes} minutes</p>
              )}
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Update status</h2>
              {shipment.statusOverridden && (
                <p className="text-sm text-amber-600 mb-4">
                  This status is manually set — automatic updates from email/flight data are paused for this shipment.{' '}
                  <button onClick={resumeAutomation} disabled={saving} className="underline">Resume automation</button>
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    disabled={saving}
                    className={s === shipment.status ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (e.g. reason for manual override)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={2}
              />
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Source emails</h2>
              {data.emails.length === 0 ? (
                <p className="text-gray-500 text-sm">No source emails recorded.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.emails.map((e, i) => (
                    <div key={i} className="py-2">
                      <p className="text-sm text-gray-800">{e.subject}</p>
                      <p className="text-xs text-gray-400">{e.from} · {fmtDateTime(e.date)} · {e.category}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
