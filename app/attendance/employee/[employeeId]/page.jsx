'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '../../../components/common/Navigation';

const STATUS_BADGE = { OnTime: 'badge-success', Late: 'badge-warning', HalfDay: 'badge-warning', Absent: 'badge-danger', Leave: 'badge-info' };
const LEAVE_BADGE = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function EmployeeAttendanceDetail() {
  const router = useRouter();
  const { employeeId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/attendance/employee/${employeeId}?days=60`)
      .then((r) => r.json())
      .then((body) => { if (!cancelled) { if (body.error) setError(body.error); else setData(body); } })
      .catch(() => { if (!cancelled) setError('Could not load.'); });
    return () => { cancelled = true; };
  }, [employeeId]);

  return (
    <div className="min-h-screen bg-mist">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <button onClick={() => router.push('/employees')} className="text-xs text-slate hover:text-ink mb-4">← Back to employees</button>

        {error && <p className="text-signal text-sm">{error}</p>}
        {!data && !error && <p className="text-slate text-sm">Loading…</p>}

        {data && (
          <>
            <h1 className="font-display text-2xl font-semibold text-ink mb-1">{data.employee.name}</h1>
            <p className="font-tabular text-sm text-slate-light mb-6">{data.employee.employeeId} · {data.employee.department} · {data.employee.shift_timing || '—'}</p>

            <div className="grid grid-cols-5 gap-px bg-line mb-6">
              {Object.entries(data.summary).map(([label, value]) => (
                <div key={label} className="bg-paper text-center py-3">
                  <p className="text-[10px] text-slate">{label}</p>
                  <p className="font-tabular text-xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>

            <h2 className="font-display text-sm font-semibold text-ink mb-2">Attendance (last 60 days)</h2>
            {data.records.length === 0 ? (
              <p className="text-sm text-slate-light mb-6">No records yet.</p>
            ) : (
              <div className="bg-paper border border-line divide-y divide-line mb-6 max-h-96 overflow-y-auto">
                {data.records.map((r) => (
                  <div key={r.date} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="font-tabular text-slate">{r.date}</span>
                    <span className="font-tabular text-ink">{fmtTime(r.checkInTime)} → {fmtTime(r.checkOutTime)}</span>
                    <span className={STATUS_BADGE[r.status] || 'badge-info'}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}

            <h2 className="font-display text-sm font-semibold text-ink mb-2">Leave requests</h2>
            {data.leaveRequests.length === 0 ? (
              <p className="text-sm text-slate-light">No leave requests.</p>
            ) : (
              <div className="bg-paper border border-line divide-y divide-line">
                {data.leaveRequests.map((lr) => (
                  <div key={lr._id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-tabular text-xs text-slate">{lr.fromDate} → {lr.toDate}</span>
                      <span className={LEAVE_BADGE[lr.status]}>{lr.status}</span>
                    </div>
                    <p className="text-sm text-slate">"{lr.reason}"</p>
                    {lr.managerNote && <p className="text-xs text-slate-light mt-1">Manager note: {lr.managerNote}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
