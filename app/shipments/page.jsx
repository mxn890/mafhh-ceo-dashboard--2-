'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/common/Navigation';
import { useLivePolling } from '../lib/useLivePolling';

const STATUS_BADGE = { Pending: 'badge-warning', Active: 'badge-success', Delayed: 'badge-danger', Completed: 'badge-success' };
const FILTERS = ['All', 'Pending', 'Active', 'Delayed', 'Completed'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ShipmentsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const qs = new URLSearchParams();
      if (filter !== 'All') qs.set('status', filter);
      if (search.trim()) qs.set('awb', search.trim());
      const res = await fetch(`/api/shipments?${qs}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Request failed');
      setData(body);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useLivePolling(load, { deps: [filter, search] });

  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shipment Tracking</h1>
          <p className="text-gray-600">Live from email bookings and flight status — AWB search, status management</p>
        </div>

        {error && (
          <div className="card border-l-4 border-red-500 bg-red-50 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {['Pending', 'Active', 'Delayed', 'Completed'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`card-compact text-center ${filter === s ? 'ring-2 ring-blue-500' : ''}`}
              >
                <p className="text-xs text-gray-500">{s}</p>
                <p className="text-2xl font-bold text-gray-900">{summary[s]}</p>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={f === filter ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by AWB number"
            className="ml-auto w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {!data && !error && <p className="text-gray-500">Loading shipments...</p>}

        {data && data.shipments.length === 0 && <p className="text-gray-500">No shipments match this view.</p>}

        {data && data.shipments.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">AWB</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Flight</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Route</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Commodity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.shipments.map((s) => (
                  <tr key={s.awb} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{s.awb}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.flightNumber || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.origin && s.destination ? `${s.origin}-${s.destination}` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(s.flightDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.commodity || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={STATUS_BADGE[s.status] || 'badge-info'}>{s.status}</span>
                      {s.statusOverridden && <span className="ml-2 text-xs text-gray-400">(manual)</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/shipments/${s.awb}`} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        View →
                      </Link>
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
