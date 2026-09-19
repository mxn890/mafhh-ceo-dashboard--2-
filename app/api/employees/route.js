import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/connect';
import { Employee } from '@/app/lib/db/models';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const employees = await Employee.find({}).sort({ department: 1, name: 1 });
    return NextResponse.json({ employees });
  } catch (err) {
    return NextResponse.json({ error: 'Could not load employees.' }, { status: 500 });
  }
}
