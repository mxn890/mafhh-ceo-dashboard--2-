// Presentation helpers: keep stored durations untouched and never show raw floats.
export function numberValue(value) {
  if (value == null || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
export function formatCount(value) {
  const n = numberValue(value);
  return n == null ? '—' : Math.round(Math.max(0, n)).toLocaleString('en-GB');
}
export function formatMinutes(value) {
  const n = numberValue(value);
  if (n == null) return '—';
  const m = Math.round(Math.max(0, n));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
export function formatPercent(value) {
  const n = numberValue(value);
  return n == null ? '—' : `${Math.round(Math.min(100, Math.max(0, n)))}%`;
}
export function validDate(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}
export function formatClock(value) {
  const d = validDate(value);
  return d ? d.toLocaleTimeString('en-GB', {timeZone:'Asia/Karachi', hour:'2-digit', minute:'2-digit', hour12:false}) : '—';
}
export function formatWhen(value) {
  const d = validDate(value);
  return d ? d.toLocaleString('en-GB', {timeZone:'Asia/Karachi', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:false}) : '—';
}
export function formatDate(value) {
  const d = validDate(value);
  return d ? d.toLocaleDateString('en-GB', {timeZone:'Asia/Karachi', day:'2-digit', month:'short', year:'numeric'}) : '—';
}
export function relativeTime(value, now = Date.now()) {
  const d = validDate(value);
  if (!d) return 'not reported';
  const m = Math.max(0, Math.floor((now - d.getTime()) / 60000));
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`;
}
// Only normalize explicit fractional durations, leaving IDs, dates and other evidence intact.
export function formatAlertText(value) {
  return String(value ?? '').replace(/\b(\d+\.\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)\b/gi, (_, value, unit) => {
    if (/^(hour|hr)/i.test(unit)) return formatMinutes(Number(value) * 60);
    if (/^(second|sec)/i.test(unit)) return `${Math.round(Number(value))}s`;
    return formatMinutes(value);
  });
}
