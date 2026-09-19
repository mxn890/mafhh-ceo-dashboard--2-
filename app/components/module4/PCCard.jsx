'use client';

import Link from 'next/link';

const STATUS_BAR = { ONLINE: 'bg-ok', IDLE: 'bg-warn', OFFLINE: 'bg-slate-light' };
const STATUS_LABEL = { ONLINE: 'Working', IDLE: 'Idle', OFFLINE: 'No signal' };
const STATUS_TEXT = { ONLINE: 'text-ok', IDLE: 'text-warn', OFFLINE: 'text-slate-light' };

function timeAgo(timestamp) {
  if (!timestamp) return 'never reported';
  const diffMins = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const hours = Math.floor(diffMins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function fmtMins(mins) {
  const m = Math.round(mins || 0);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function PCCard({ pc }) {
  return (
    <Link href={`/employees/${pc.seatId}`} className="block h-full">
      <div className="bg-paper border border-line h-full relative pl-4">
        <span className={`absolute left-0 top-0 bottom-0 w-1 ${STATUS_BAR[pc.status] || 'bg-slate-light'}`} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-tabular text-xs text-slate-light">{pc.pcId}{pc.shiftKind ? ` · ${pc.shiftKind}` : ''}</p>
              <h3 className="font-display font-semibold text-ink truncate">{pc.employee}</h3>
              <p className="text-xs text-slate">{pc.department} · {pc.location}</p>
            </div>
            <span className={`text-xs font-medium shrink-0 ${STATUS_TEXT[pc.status] || 'text-slate-light'}`}>
              {STATUS_LABEL[pc.status] || pc.status}
            </span>
          </div>

          <p className="mt-3 truncate text-xs text-slate" title={pc.currentTitle || ''}>
            {pc.currentTitle || 'Nothing reported yet'}
          </p>

          <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-xs">
            <span className="text-slate">Active <span className="font-tabular text-ink font-medium">{fmtMins(pc.todayActiveMins)}</span></span>
            <span className="text-slate">Seen <span className="font-tabular text-ink font-medium">{timeAgo(pc.lastSeenAt)}</span></span>
          </div>

          {pc.topSite && pc.topSite.mins > 0 && (
            <p className="mt-2 text-xs text-slate-light truncate">
              Top: {pc.topSite.name} · {fmtMins(pc.topSite.mins)}
            </p>
          )}

          {pc.alertsToday > 0 && (
            <div className="mt-3 pt-3 border-t border-line">
              <span className="badge-danger">
                {pc.alertsToday} alert{pc.alertsToday === 1 ? '' : 's'}
                {pc.highAlertsToday > 0 ? ` · ${pc.highAlertsToday} high` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
