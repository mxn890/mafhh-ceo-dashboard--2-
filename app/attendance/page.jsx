'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '../components/common/Navigation';

const LiveMap = dynamic(() => import('../components/common/LiveMap'), { ssr: false, loading: () => <p className="text-sm text-slate p-6">Loading map…</p> });

const STATUS_BADGE = { OnTime: 'badge-success', Late: 'badge-warning', HalfDay: 'badge-warning', Absent: 'badge-danger', Leave: 'badge-info' };

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function AttendancePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/attendance/overview')
      .then((r) => r.json())
      .then((body) => { if (!cancelled) { if (body.error) setError(body.error); else setData(body); } })
      .catch(() => { if (!cancelled) setError('Could not load attendance.'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    function loadLive() {
      fetch('/api/attendance/live-locations')
        .then((r) => r.json())
        .then((body) => { if (!cancelled && !body.error) setLiveData(body); })
        .catch(() => {});
    }
    loadLive();
    const t = setInterval(loadLive, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <div className="min-h-screen bg-mist">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink mb-1">Attendance</h1>
            <p className="text-sm text-slate">GPS and selfie-verified check-in, by shift</p>
          </div>
          <a href={process.env.NEXT_PUBLIC_ATTENDANCE_PORTAL_URL ? `${process.env.NEXT_PUBLIC_ATTENDANCE_PORTAL_URL}/manager` : '#'} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">Open manager view →</a>
        </div>

        {error && <p className="text-signal text-sm">{error}</p>}
        {!data && !error && <p className="text-slate text-sm">Loading…</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-line mb-6">
              {Object.entries(data.summary).map(([label, value]) => (
                <div key={label} className="bg-paper text-center py-4">
                  <p className="text-xs text-slate mb-1">{label}</p>
                  <p className="font-tabular text-2xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>

            {liveData && (
              <div className="mb-6">
                <p className="font-display text-sm font-semibold text-ink mb-2">
                  Live locations — {liveData.points.length} on duty right now
                </p>
                {liveData.points.length === 0 ? (
                  <div className="card"><p className="text-sm text-slate-light">No one is currently checked in.</p></div>
                ) : (
                  <div className="border border-line">
                    <LiveMap points={liveData.points} office={liveData.office} airport={liveData.airport} />
                  </div>
                )}
              </div>
            )}

            <div className="bg-paper border border-line overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-mist border-b border-line">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-slate">Employee</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate">Department</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate">Shift</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate">Check-in</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate">Check-out</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.rows.map((r) => (
                    <tr key={r.employeeId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{r.name}</p>
                        <p className="font-tabular text-xs text-slate-light">{r.employeeId}</p>
                      </td>
                      <td className="px-4 py-3 text-slate">{r.department}</td>
                      <td className="px-4 py-3 font-tabular text-slate">{r.shift_timing || '—'}</td>
                      <td className="px-4 py-3 font-tabular text-ink">{fmtTime(r.checkInTime)}</td>
                      <td className="px-4 py-3 font-tabular text-ink">{fmtTime(r.checkOutTime)}</td>
                      <td className="px-4 py-3"><span className={STATUS_BADGE[r.status] || 'badge-info'}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.leaveRequests?.length > 0 && (
              <div className="mt-6">
                <p className="font-display text-sm font-semibold text-ink mb-2">Recent leave requests</p>
                <div className="bg-paper border border-line divide-y divide-line">
                  {data.leaveRequests.map((lr) => (
                    <div key={lr._id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink">{lr.employeeName} <span className="font-tabular text-xs text-slate-light">({lr.employeeId})</span></span>
                        <span className={lr.status === 'approved' ? 'badge-success' : lr.status === 'rejected' ? 'badge-danger' : 'badge-warning'}>{lr.status}</span>
                      </div>
                      <p className="font-tabular text-xs text-slate mb-1">{lr.fromDate} → {lr.toDate}</p>
                      <p className="text-sm text-slate">"{lr.reason}"</p>
                      {lr.managerNote && <p className="text-xs text-slate-light mt-1">Manager note: {lr.managerNote}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
