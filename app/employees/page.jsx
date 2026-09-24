'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/common/Navigation';

const STATUS_BADGE = { OnTime: 'badge-success', Late: 'badge-warning', HalfDay: 'badge-warning', Absent: 'badge-danger', Leave: 'badge-info' };

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState(null);
  const [attendanceByEmployee, setAttendanceByEmployee] = useState({});
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/employees');
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Request failed');
        if (!cancelled) setEmployees(body.employees);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }

      // Today's real attendance status, keyed by employeeId — this is
      // what actually answers "who's here today", not the static
      // employment-status field (which just means "still on the roster").
      try {
        const attRes = await fetch('/api/attendance/overview');
        const attBody = await attRes.json();
        if (!cancelled && attBody.rows) {
          const map = {};
          for (const r of attBody.rows) map[r.employeeId] = r.status;
          setAttendanceByEmployee(map);
        }
      } catch {
        // attendance status is a nice-to-have here — don't block the roster if it fails
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!employees) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter((e) =>
      e.name.toLowerCase().includes(needle) ||
      e.department?.toLowerCase().includes(needle) ||
      e.employeeId?.toLowerCase().includes(needle)
    );
  }, [employees, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const key = e.department || 'Unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="min-h-screen bg-mist">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink mb-1">Employees</h1>
            <p className="text-sm text-slate">
              {employees ? `${employees.length} people across ${grouped.length} departments` : 'Loading roster…'}
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, department, ID"
            className="w-full sm:w-72 border border-line px-3 py-2 text-sm bg-paper focus:outline-none focus:border-ink"
          />
        </div>

        {error && (
          <div className="card border-l-2 border-signal bg-signal-light mb-6">
            <p className="text-signal text-sm">{error}</p>
          </div>
        )}

        {!employees && !error && <p className="text-slate text-sm">Loading…</p>}

        {employees && grouped.length === 0 && (
          <p className="text-slate text-sm">No employees match this search.</p>
        )}

        <div className="space-y-8">
          {grouped.map(([department, people]) => (
            <div key={department}>
              <h2 className="font-display text-sm font-semibold text-ink mb-3 pb-2 border-b border-line">
                {department} <span className="text-slate-light font-normal">· {people.length}</span>
              </h2>
              <div className="bg-paper border border-line">
                {people.map((emp, i) => {
                  const todayStatus = attendanceByEmployee[emp.employeeId];
                  return (
                    <div
                      key={emp._id}
                      onClick={() => router.push(`/attendance/employee/${emp.employeeId}`)}
                      className={`flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-mist transition-colors ${i !== people.length - 1 ? 'border-b border-line' : ''}`}
                    >
                      <div className="min-w-0 flex items-center gap-4">
                        <span className="font-tabular text-xs text-slate-light w-24 shrink-0">{emp.employeeId || '—'}</span>
                        <span className="font-medium text-sm text-ink truncate">{emp.name}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-tabular text-xs text-slate hidden sm:block">{emp.shift_timing || '—'}</span>
                        {todayStatus ? (
                          <span className={STATUS_BADGE[todayStatus] || 'badge-info'}>{todayStatus}</span>
                        ) : (
                          <span className="badge-info">No data</span>
                        )}
                        <span className="text-slate-light">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
