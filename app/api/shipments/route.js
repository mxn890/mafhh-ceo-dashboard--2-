import { NextResponse } from 'next/server';
import { getShipments, getShipmentSummary } from '@/app/lib/module123/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const status = request.nextUrl.searchParams.get('status') || undefined;
  const awb = request.nextUrl.searchParams.get('awb') || undefined;

  // Temporary, per explicit request: skip the backlog of older
  // unresolved Pending shipments for now, show only ones whose flight
  // hasn't happened yet. Revert by removing pendingFutureOnly here.
  const pendingFutureOnly = true;

  try {
    const [list, summary] = await Promise.all([
      getShipments({ status, awb, limit: 200, pendingFutureOnly }),
      getShipmentSummary({ pendingFutureOnly }),
    ]);
    return NextResponse.json({ ...list, summary }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: 'Could not reach the shipment server.', detail: err.message }, { status: 502 });
  }
}
