/**
 * Server-side client for the Module 4 VPS API.
 * Only ever imported from app/api/* route handlers — never from a 'use client'
 * component, so the VPS address never reaches the browser.
 *
 * Everything here is keyed by SEAT, not by PC. A seat is one (PC, employee,
 * shift) — for 14 of the 15 PCs, seatId === pcId, nothing changes. PC-10 has
 * two employees (Amjad 09:00-18:00, Hamza 21:00-06:00) sharing one machine,
 * so it has two seats: PC-10-S1 and PC-10-S2, tracked completely
 * independently all the way through — see module4-pcConfig.js on the VPS
 * for where seatId actually comes from.
 */

const BASE = process.env.MODULE4_API_URL || 'http://195.162.243.191:5004';
const TIMEOUT_MS = 8000;
const TZ = 'Asia/Karachi';

async function get(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, cache: 'no-store' });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: body?.error || `${res.status} ${res.statusText}`, data: null };
    return { ok: true, error: null, data: body };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Monitoring server timed out' : err.message, data: null };
  } finally {
    clearTimeout(timer);
  }
}

async function patch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`);
  return data;
}

function dayKeyPKT(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);
}

/**
 * Midnight PKT as a JS Date, in the same way module4-apiRoutes.js computes it
 * on the server. Used to ask for "today's" activity logs.
 */
function startOfTodayPKT(date = new Date()) {
  const [y, m, d] = dayKeyPKT(date).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 5 * 3600 * 1000);
}

function isToday(timestamp) {
  if (!timestamp) return false;
  return dayKeyPKT(new Date(timestamp)) === dayKeyPKT();
}

function formatShift(startTime, endTime) {
  if (!startTime) return 'Not scheduled';
  return `${startTime}–${endTime}`;
}

/* ---------------------------- raw endpoints ---------------------------- */

/** One row per employee-shift, not per PC — PC-10 contributes two rows. */
export async function getSeats() {
  const r = await get('/api/module4/config/seats');
  if (!r.ok) return [];
  const seats = r.data.seats;
  const pcSeatCounts = new Map();
  for (const s of seats) pcSeatCounts.set(s.pcId, (pcSeatCounts.get(s.pcId) || 0) + 1);
  return seats.map((s) => ({ ...s, hasSiblingShift: pcSeatCounts.get(s.pcId) > 1 }));
}

export async function getSeatConfig(seatId) {
  const r = await get(`/api/module4/config/seats/${seatId}`);
  return r.ok ? r.data : null;
}

export async function getMetrics() {
  const r = await get('/api/module4/metrics');
  return r.ok ? r.data.metrics : [];
}

export async function getMetric(seatId) {
  const r = await get(`/api/module4/metrics/${seatId}`);
  return r.ok ? r.data.metrics : null;
}

export async function getScreenTimeAll() {
  const r = await get('/api/module4/screen-time');
  return r.ok ? r.data.screenTime : [];
}

export async function getScreenTime(seatId) {
  const r = await get(`/api/module4/screen-time/${seatId}`);
  return r.ok ? r.data : null;
}

export async function getAlerts({ pcId, seatId, limit = 200, startDate, endDate } = {}) {
  const qs = new URLSearchParams();
  if (pcId) qs.set('pcId', pcId);
  if (seatId) qs.set('seatId', seatId);
  if (startDate) qs.set('startDate', startDate);
  if (endDate) qs.set('endDate', endDate);
  qs.set('limit', String(limit));
  const r = await get(`/api/module4/alerts?${qs}`);
  return r.ok ? r.data.alerts : [];
}

export async function getActivityLogs({ pcId, seatId, limit = 30 } = {}) {
  const qs = new URLSearchParams();
  if (pcId) qs.set('pcId', pcId);
  if (seatId) qs.set('seatId', seatId);
  qs.set('limit', String(limit));
  const r = await get(`/api/module4/activity/logs?${qs}`);
  return r.ok ? r.data.logs : [];
}

export async function getDailyReport({ pcId, seatId, date } = {}) {
  const qs = new URLSearchParams();
  if (pcId) qs.set('pcId', pcId);
  if (seatId) qs.set('seatId', seatId);
  if (date) qs.set('date', date);
  const r = await get(`/api/module4/reports/daily?${qs}`);
  return r.ok ? r.data.reports : [];
}

export async function acknowledgeAlert(alertId, { acknowledgedBy, notes } = {}) {
  return patch(`/api/module4/alerts/${alertId}`, { acknowledgedBy, notes });
}

/* ------------------------------ composed views ------------------------------ */

/** Everything the /module4 grid page needs, in one round trip. */
export async function getGridSnapshot() {
  const [seats, metrics, screenTime, alerts] = await Promise.all([
    getSeats(),
    getMetrics(),
    getScreenTimeAll(),
    getAlerts({ limit: 300 }),
  ]);

  const metricBySeat = new Map(metrics.map((m) => [m.seatId, m]));
  const screenBySeat = new Map(screenTime.map((s) => [s.seatId, s]));

  const todaysAlerts = alerts.filter((a) => isToday(a.timestamp));
  const alertsBySeat = new Map();
  for (const a of todaysAlerts) {
    const key = a.seatId || a.pcId;
    const list = alertsBySeat.get(key) || [];
    list.push(a);
    alertsBySeat.set(key, list);
  }

  const pcs = seats.map((seat) => {
    const metric = metricBySeat.get(seat.seatId);
    const st = screenBySeat.get(seat.seatId);
    const seatAlerts = alertsBySeat.get(seat.seatId) || [];

    return {
      pcId: seat.pcId,
      seatId: seat.seatId,
      employee: metric?.employee || seat.employee || 'Unassigned',
      department: seat.department,
      location: seat.location,
      shiftLabel: formatShift(seat.startTime, seat.endTime),
      shiftKind: seat.hasSiblingShift ? (seat.shiftNumber === 1 ? 'Day shift' : 'Night shift') : null,
      isOnDuty: metric?.isOnDuty ?? null,
      status: metric?.status || 'OFFLINE',
      lastSeenAt: metric?.lastSeenAt || null,
      currentTitle: metric?.currentTitle || null,
      currentSite: metric?.currentSite || null,
      todayActiveMins: metric?.todayActiveMins || 0,
      todayIdleMins: metric?.todayIdleMins || 0,
      todayNonWorkMins: metric?.todayNonWorkMins || 0,
      totalScreenMins: st?.totalMins || 0,
      topSite: st?.topSites?.[0] || null,
      alertsToday: seatAlerts.length,
      highAlertsToday: seatAlerts.filter((a) => a.severity === 'HIGH').length,
    };
  });

  return {
    pcs: pcs.sort((a, b) => a.seatId.localeCompare(b.seatId, undefined, { numeric: true })),
    summary: {
      total: pcs.length,
      online: pcs.filter((p) => p.status === 'ONLINE').length,
      idle: pcs.filter((p) => p.status === 'IDLE').length,
      offline: pcs.filter((p) => p.status === 'OFFLINE').length,
      alertsToday: todaysAlerts.length,
      highAlertsToday: todaysAlerts.filter((a) => a.severity === 'HIGH').length,
    },
    generatedAt: new Date().toISOString(),
  };
}

/** Everything one employee's profile page needs. */
export async function getEmployeeProfile(seatId) {
  const [cfg, metric, screenTime, alerts, recentActivity, dailyReports, allSeats] = await Promise.all([
    getSeatConfig(seatId),
    getMetric(seatId),
    getScreenTime(seatId),
    getAlerts({ seatId, limit: 30 }),
    getActivityLogs({ seatId, limit: 40 }),
    getDailyReport({ seatId }),
    getSeats(),
  ]);

  if (!cfg) return null;
  const seat = cfg.seat;
  const hasSiblingShift = allSeats.some((s) => s.pcId === seat.pcId && s.seatId !== seat.seatId);

  return {
    pcId: seat.pcId,
    seatId: seat.seatId,
    employee: metric?.employee || seat.employee || 'Unassigned',
    department: seat.department,
    location: seat.location,
    shiftLabel: formatShift(seat.startTime, seat.endTime),
    shiftKind: hasSiblingShift ? (seat.shiftNumber === 1 ? 'Day shift' : 'Night shift') : null,
    offDay: seat.offDay || null,
    isOnDuty: cfg.isOnDuty ?? null,
    isOffDay: cfg.isOffDay ?? false,
    status: metric?.status || 'OFFLINE',
    lastSeenAt: metric?.lastSeenAt || null,
    currentTitle: metric?.currentTitle || null,
    today: {
      activeMins: metric?.todayActiveMins || 0,
      idleMins: metric?.todayIdleMins || 0,
      nonWorkMins: metric?.todayNonWorkMins || 0,
      alertsCount: metric?.alertsCount || 0,
    },
    screenTime: screenTime
      ? {
          totalMins: screenTime.totalMins,
          totalHours: screenTime.totalHours,
          topSites: screenTime.topSites,
          categories: screenTime.categories,
        }
      : { totalMins: 0, totalHours: '0.0', topSites: [], categories: [] },
    alerts,
    recentActivity,
    dailyReport: dailyReports?.[0] || null,
  };
}

/**
 * First activity log timestamp for a seat today — used as a "first seen"
 * proxy for arrival. This is PC activity, not verified attendance: there's
 * no GPS, no selfie, no check-in action. If the agent didn't run, or the
 * employee did something that never registered a whitelisted/tracked
 * window in the first few minutes, this can read later than they actually
 * arrived. Treat it as a signal to look into, not a verdict.
 */
async function getFirstActivityToday(seatId) {
  const since = startOfTodayPKT();
  const qs = new URLSearchParams({ seatId, limit: '300', startDate: since.toISOString() });
  const r = await get(`/api/module4/activity/logs?${qs}`);
  if (!r.ok || !r.data.logs?.length) return null;
  // Server returns newest-first; the oldest entry within today is the last one.
  const oldest = r.data.logs[r.data.logs.length - 1];
  return oldest.timestamp || null;
}

/**
 * Presence-by-PC-activity for every seat, for the Attendance page.
 * This is explicitly NOT the GPS + selfie attendance system from the scope
 * doc (Module 5) — that needs the client's shift-rules form before it can be
 * built. This is what's actually available today: whether that seat's PC
 * has been used yet, and when it was first seen — per employee, so PC-10's
 * two shifts show as two separate rows, each against their own shift start.
 */
export async function getPresenceToday() {
  const [seats, metrics] = await Promise.all([getSeats(), getMetrics()]);
  const metricBySeat = new Map(metrics.map((m) => [m.seatId, m]));

  const rows = await Promise.all(
    seats.map(async (seat) => {
      const cfg = await getSeatConfig(seat.seatId);
      const metric = metricBySeat.get(seat.seatId);
      const firstSeenToday = await getFirstActivityToday(seat.seatId);

      let deltaMinsFromShiftStart = null;
      if (firstSeenToday && seat.startTime) {
        const seen = new Date(firstSeenToday);
        const seenMinsPKT =
          Number(
            new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(seen)
          ) * 60 +
          Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, minute: '2-digit' }).format(seen));
        const [sh, sm] = seat.startTime.split(':').map(Number);
        deltaMinsFromShiftStart = seenMinsPKT - (sh * 60 + sm);
      }

      return {
        pcId: seat.pcId,
        seatId: seat.seatId,
        employee: metric?.employee || seat.employee || 'Unassigned',
        department: seat.department,
        location: seat.location,
        shiftLabel: formatShift(seat.startTime, seat.endTime),
        shiftKind: seat.hasSiblingShift ? (seat.shiftNumber === 1 ? 'Day shift' : 'Night shift') : null,
        isOffDay: cfg?.isOffDay ?? false,
        firstSeenToday,
        lastSeenAt: metric?.lastSeenAt || null,
        status: metric?.status || 'OFFLINE',
        deltaMinsFromShiftStart,
      };
    })
  );

  return rows.sort((a, b) => a.seatId.localeCompare(b.seatId, undefined, { numeric: true }));
}

/* ------------------------------ history (closed past days) ------------------------------ */

const NON_WORK_CATEGORIES = new Set(['streaming', 'social', 'gaming', 'shopping']);

export function dayRangeFor(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 5 * 3600 * 1000);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

/**
 * One employee's CLOSED day — built from the persisted daily report plus
 * that day's alerts, shaped to match getEmployeeProfile()'s fields as
 * closely as possible so the same page can render either without a lot of
 * branching. Unlike "today", this can never change underneath the viewer —
 * the day is over, the report is a fact, not a still-forming number.
 */
export async function getEmployeeHistoryDay(seatId, dateStr) {
  const { start, end } = dayRangeFor(dateStr);
  const [cfg, reports, alerts, allSeats] = await Promise.all([
    getSeatConfig(seatId),
    getDailyReport({ seatId, date: dateStr }),
    getAlerts({ seatId, limit: 200, startDate: start.toISOString(), endDate: end.toISOString() }),
    getSeats(),
  ]);

  if (!cfg) return null;
  const seat = cfg.seat;
  const hasSiblingShift = allSeats.some((s) => s.pcId === seat.pcId && s.seatId !== seat.seatId);
  const report = reports?.[0] || null;

  // PCDailyReport's topSites use {url, duration, category} — "url" actually
  // holds the site name here (see buildDailyReport on the server), not a
  // real URL. Reshaped to {name, mins, percent, type} to match what the
  // live /screen-time endpoint returns, so the profile page's screen-time
  // section doesn't need two different rendering paths.
  const totalMins = report
    ? (report.topSites || []).reduce((sum, s) => sum + (s.duration || 0), 0)
    : 0;
  const topSites = report
    ? (report.topSites || []).map((s) => ({
        name: s.url,
        mins: s.duration,
        percent: totalMins > 0 ? Math.round((s.duration / totalMins) * 100) : 0,
        type: NON_WORK_CATEGORIES.has(s.category) ? 'non-work' : s.category === 'work' ? 'work' : 'unknown',
      }))
    : [];

  return {
    pcId: seat.pcId,
    seatId: seat.seatId,
    employee: report?.employee || seat.employee || 'Unassigned',
    department: seat.department,
    location: seat.location,
    shiftLabel: formatShift(seat.startTime, seat.endTime),
    shiftKind: hasSiblingShift ? (seat.shiftNumber === 1 ? 'Day shift' : 'Night shift') : null,
    mode: 'historical',
    date: dateStr,
    status: null, // a closed day has no "live" status — nothing to show as ONLINE/IDLE
    lastSeenAt: null,
    currentTitle: null,
    today: {
      activeMins: report?.totalActiveMins || 0,
      idleMins: report?.totalIdleMins || 0,
      nonWorkMins: report?.nonWorkMins || 0,
      alertsCount: report?.alertsCount ?? alerts.length,
    },
    screenTime: {
      totalMins,
      totalHours: (totalMins / 60).toFixed(1),
      topSites,
      categories: [],
    },
    alerts,
    recentActivity: [], // a full day's raw timeline is long and adds little over the report + alerts above
    dailyReport: report,
    hasReport: Boolean(report),
  };
}
