/**
 * Server-side client for the Modules 1+2+3 shipment tracking API.
 * Only imported from app/api/* route handlers — never a client component —
 * same boundary rule as app/lib/module4/client.js.
 */

const BASE = process.env.MODULE123_API_URL || 'http://195.162.243.191:5005';
const TIMEOUT_MS = 8000;

async function get(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, cache: 'no-store' });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: body?.error || `${res.status} ${res.statusText}`, data: null };
    return { ok: true, error: null, data: body };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Shipment server timed out' : err.message, data: null };
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

export async function getShipments({ status, awb, limit = 100, pendingFutureOnly } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (awb) qs.set('awb', awb);
  qs.set('limit', String(limit));
  if (pendingFutureOnly) qs.set('pendingFutureOnly', 'true');
  const r = await get(`/api/module123/shipments?${qs}`);
  return r.ok ? r.data : { shipments: [], total: 0, error: r.error };
}

export async function getShipmentSummary({ pendingFutureOnly } = {}) {
  const qs = pendingFutureOnly ? '?pendingFutureOnly=true' : '';
  const r = await get(`/api/module123/shipments/summary${qs}`);
  return r.ok ? r.data : { Pending: 0, Active: 0, Delayed: 0, Completed: 0, total: 0 };
}

export async function getShipment(awb) {
  const r = await get(`/api/module123/shipments/${awb}`);
  return r.ok ? r.data : null;
}

export async function updateShipmentStatus(awb, { status, note }) {
  return patch(`/api/module123/shipments/${awb}`, { status, note });
}

export async function resumeAutomation(awb) {
  return patch(`/api/module123/shipments/${awb}/resume-automation`, {});
}

export async function getReviewQueue() {
  const r = await get('/api/module123/review-queue');
  return r.ok ? r.data.items : [];
}
