/**
 * Pure PKT date helpers with no server dependency — safe to import from a
 * 'use client' component. app/lib/module4/client.js (note: DIFFERENT file,
 * similar name) is server-only and must never be imported from a client
 * component; this file exists so date-only logic doesn't have to live there
 * and risk that boundary.
 */

const TZ = 'Asia/Karachi';

export function dayKeyPKT(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);
}

/**
 * The last N calendar days as PKT date strings, newest first, with a
 * friendly label — "Today", "Yesterday", then "Mon 15 Sep".
 */
export function lastNDays(n = 30) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = dayKeyPKT(d);
    const label =
      i === 0 ? 'Today' : i === 1 ? 'Yesterday' :
      new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short' }).format(d);
    out.push({ date: dateStr, label });
  }
  return out;
}
