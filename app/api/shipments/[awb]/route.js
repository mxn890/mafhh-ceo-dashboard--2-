import { NextResponse } from 'next/server';
import { getShipment, updateShipmentStatus, resumeAutomation } from '@/app/lib/module123/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request, { params }) {
  try {
    const data = await getShipment(params.awb);
    if (!data) return NextResponse.json({ error: `AWB ${params.awb} not found` }, { status: 404 });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: 'Could not load shipment.', detail: err.message }, { status: 502 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const result = body.resumeAutomation
      ? await resumeAutomation(params.awb)
      : await updateShipmentStatus(params.awb, body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Could not update shipment.', detail: err.message }, { status: 502 });
  }
}
