import { NextResponse } from 'next/server';
import { getAlerts, acknowledgeAlert, dayRangeFor } from '@/app/lib/module4/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request) {
  const pcId = request.nextUrl.searchParams.get('pcId') || undefined;
  const seatId = request.nextUrl.searchParams.get('seatId') || undefined;
  const date = request.nextUrl.searchParams.get('date');

  if (date && !DATE_RE.test(date)) {
    return NextResponse.json({ error: `date must be YYYY-MM-DD, got: ${date}` }, { status: 400 });
  }

  try {
    let alerts;
    if (date) {
      const { start, end } = dayRangeFor(date);
      alerts = await getAlerts({ pcId, seatId, limit: 300, startDate: start.toISOString(), endDate: end.toISOString() });
    } else {
      alerts = await getAlerts({ pcId, seatId, limit: 300 });
    }
    return NextResponse.json({ alerts, date: date || null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not load alerts.', detail: err.message },
      { status: 502 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { alertId, acknowledgedBy, notes } = await request.json();
    if (!alertId) {
      return NextResponse.json({ error: 'alertId is required.' }, { status: 400 });
    }
    const result = await acknowledgeAlert(alertId, { acknowledgedBy, notes });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not acknowledge the alert.', detail: err.message },
      { status: 502 }
    );
  }
}
