import { NextResponse } from 'next/server';
import { getGridSnapshot } from '@/app/lib/module4/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await getGridSnapshot();
    if (!snapshot.pcs.length) {
      return NextResponse.json(
        { error: 'No PCs returned from the monitoring server.' },
        { status: 502 }
      );
    }
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not reach the monitoring server.', detail: err.message },
      { status: 502 }
    );
  }
}
