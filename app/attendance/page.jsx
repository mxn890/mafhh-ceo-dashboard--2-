'use client';

import { useEffect, useState } from 'react';
import Navigation from '../components/common/Navigation';

export default function AttendancePage() {
  const [employees, setEmployees] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/employees')
      .then((r) => r.json())
      .then((body) => { if (!cancelled) setEmployees(body.employees || []); })
      .catch(() => { if (!cancelled) setEmployees([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-mist relative">
      <Navigation />

      {/* Background preview — blurred, gives a sense of the real thing without functioning yet */}
      <main className="container mx-auto px-4 py-8 blur-sm pointer-events-none select-none" aria-hidden="true">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink mb-1">Attendance</h1>
          <p className="text-sm text-slate">GPS and photo-verified check-in, by shift</p>
        </div>

        <div className="bg-paper border border-line">
          <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-line text-xs font-semibold text-slate">
            <span>Employee</span>
            <span>Department</span>
            <span>Shift</span>
            <span>Check-in</span>
            <span>Status</span>
          </div>
          {(employees || Array.from({ length: 8 })).slice(0, 10).map((emp, i) => (
            <div key={emp?._id || i} className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-line last:border-0 text-sm">
              <span className="font-medium text-ink">{emp?.name || '—'}</span>
              <span className="text-slate">{emp?.department || '—'}</span>
              <span className="font-tabular text-slate">{emp?.shift_timing || '—'}</span>
              <span className="font-tabular text-slate">—:—</span>
              <span className="badge-info">Pending setup</span>
            </div>
          ))}
        </div>
      </main>

      {/* Overlay */}
      <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-ink/10">
        <div className="bg-paper border border-line max-w-md w-full p-8 shadow-2xl">
          <span className="inline-block w-2 h-2 bg-signal mb-4" />
          <h2 className="font-display text-xl font-semibold text-ink mb-2">Attendance — being configured</h2>
          <p className="text-sm text-slate leading-relaxed mb-4">
            GPS and photo check-in for the office and Allama Iqbal Airport locations is being set up
            against the shift rules already provided:
          </p>
          <ul className="text-sm text-ink space-y-1.5 mb-5">
            <li className="flex justify-between"><span className="text-slate">Shift start</span><span className="font-tabular">9:00 AM</span></li>
            <li className="flex justify-between"><span className="text-slate">Late after</span><span className="font-tabular">9:30 AM</span></li>
            <li className="flex justify-between"><span className="text-slate">Half-day after</span><span className="font-tabular">10:00 AM</span></li>
            <li className="flex justify-between"><span className="text-slate">Shift end</span><span className="font-tabular">6:00 PM</span></li>
          </ul>
          <p className="text-xs text-slate-light">
            The table behind this is a preview of the layout — no check-ins are recorded yet.
          </p>
        </div>
      </div>
    </div>
  );
}
