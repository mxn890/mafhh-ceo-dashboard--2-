import { NextResponse } from 'next/server';
import { getEmployeeProfile, getEmployeeHistoryDay } from '@/app/lib/module4/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// A seat is a PC id, optionally with a -S1/-S2 suffix for a dual-shift PC
// (e.g. PC-10-S1 for Amjad, PC-10-S2 for Hamza). The dynamic segment is
// still called [pcId] to avoid renaming every file, but the value it
// receives is a seat id.
const SEAT_ID_RE = /^PC-\d{2,3}(-S\d)?$/;

export async function GET(request, { params }) {
  const seatId = String(params.pcId || '').toUpperCase();
  const date = request.nextUrl.searchParams.get('date');

  if (!SEAT_ID_RE.test(seatId)) {
    return NextResponse.json({ error: `Unknown seat id: ${seatId}` }, { status: 400 });
  }
  if (date && !DATE_RE.test(date)) {
    return NextResponse.json({ error: `date must be YYYY-MM-DD, got: ${date}` }, { status: 400 });
  }

  try {
    const profile = date ? await getEmployeeHistoryDay(seatId, date) : await getEmployeeProfile(seatId);
    if (!profile) {
      return NextResponse.json({ error: `${seatId} not found in config.` }, { status: 404 });
    }
    return NextResponse.json(profile, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not load ${seatId}.`, detail: err.message },
      { status: 502 }
    );
  }
}
