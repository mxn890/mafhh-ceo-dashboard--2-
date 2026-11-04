'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {countBy} from '../lib/dashboard-analytics';
import { useRouter } from 'next/navigation';
import {Panel,Ranking,StatGrid} from '../components/common/Analytics';
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
            aria-label="Search employees" placeholder="Search name, department, ID"
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

        {employees && <StatGrid items={[{label:'Employees',value:employees.length,tone:'dark'},{label:'Departments',value:new Set(employees.map(e=>e.department||'Unassigned')).size},{label:'Absent today',value:Object.values(attendanceByEmployee).filter(s=>s==='Absent').length,tone:'danger'}]}/>}
        <div className="employee-layout"><div className="department-list">{grouped.map(([department,people])=><section className="analytics-panel" key={department}><header><h2>{department} <span className="text-slate font-normal">· {people.length}</span></h2></header><div className="employee-table-scroll"><table className="employee-table"><thead><tr><th>Employee</th><th>Emp ID</th><th>Shift</th><th>Status</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{people.map(emp=><tr key={emp._id||emp.employeeId}><td><Link className="employee-name" href={`/attendance/employee/${emp.employeeId}`}><span className="employee-avatar" aria-hidden="true">{String(emp.name||'').split(/\s+/).slice(0,2).map(s=>s[0]).join('')}</span>{emp.name}</Link></td><td>{emp.employeeId||'—'}</td><td>{emp.shift_timing||'—'}</td><td><span className={STATUS_BADGE[attendanceByEmployee[emp.employeeId]]||'badge-info'}>{attendanceByEmployee[emp.employeeId]||'No data'}</span></td><td><Link aria-label={`View attendance for ${emp.name}`} href={`/attendance/employee/${emp.employeeId}`} className="round-arrow">→</Link></td></tr>)}</tbody></table></div></section>)}</div><aside><Panel title="Departments" subtitle={employees?`${new Set(employees.map(e=>e.department||'Unassigned')).size} departments`:''}>{employees&&<div className="department-index">{countBy(employees,e=>e.department||'Unassigned').sort((a,b)=>a.label.localeCompare(b.label)).map(d=><button key={d.label} onClick={()=>setQuery(d.label)}><span className="employee-avatar">{d.label[0]}</span><span>{d.label}</span><b>{d.value}</b></button>)}{query&&<button onClick={()=>setQuery('')}>Show all employees →</button>}</div>}</Panel></aside></div>
      </main>
    </div>
  );
}

