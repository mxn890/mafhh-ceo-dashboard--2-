import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/connect';
import { Employee, Attendance, LeaveRequest } from '@/app/lib/db/models';
import { getSession } from '@/app/lib/auth/jwt';

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { employeeId } = params;
  const days = Math.min(parseInt(request.nextUrl.searchParams.get('days'), 10) || 30, 180);

  await connectDB();
  const employee = await Employee.findOne({ employeeId });
  if (!employee) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });

  const records = await Attendance.find({ employeeId }).sort({ date: -1 }).limit(days);
  const summary = { OnTime: 0, Late: 0, HalfDay: 0, Absent: 0, Leave: 0 };
  for (const r of records) if (summary[r.status] !== undefined) summary[r.status]++;

  const leaveRequests = await LeaveRequest.find({ employeeId }).sort({ requestedAt: -1 });

  return NextResponse.json({
    employee: { employeeId: employee.employeeId, name: employee.name, department: employee.department, shift_timing: employee.shift_timing },
    records: records.map((r) => ({
      date: r.date,
      status: r.status,
      checkInTime: r.checkIn?.time || null,
      checkOutTime: r.checkOut?.time || null,
    })),
    summary,
    leaveRequests,
  });
}
