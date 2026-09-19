import { NextResponse } from 'next/server';
import { getPresenceToday } from '@/app/lib/module4/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await getPresenceToday();
    return NextResponse.json({ rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not load presence data.', detail: err.message },
      { status: 502 }
    );
  }
}
