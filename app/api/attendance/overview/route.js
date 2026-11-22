import { resolvedAttendanceStatus } from '@/app/lib/attendance-calendar';
import { dayPKT, addDays, shiftDate, shiftLabel, missingStatus } from '@/app/lib/attendance-policy';
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/connect';
import { Employee, Attendance, AttendanceConfig, LeaveRequest } from '@/app/lib/db/models';
import { getSession } from '@/app/lib/auth/jwt';

function todayPKT() {
  const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  await connectDB();
  const now = new Date(), date = dayPKT(now);
  const config = (await AttendanceConfig.findOne({key:'default'}).lean()) || {};
  const employees = await Employee.find({ status: 'active' }).sort({ department: 1, name: 1 });
  const records = await Attendance.find({ date: { $gte: addDays(date, -1), $lte: date } });
  const byEmployeeId = new Map(records.map((r) => [r.employeeId + ":" + r.date, r]));

  const rows = employees.map((e) => {
    const attendanceDate = shiftDate(e, config, now);
    const rec = byEmployeeId.get(e.employeeId + ":" + attendanceDate);
    return {
      employeeId: e.employeeId,
      name: e.name,
      department: e.department,
      shift_timing: shiftLabel(e, config, rec?.date || attendanceDate),
      attendanceDate: rec?.date || attendanceDate,
      status: resolvedAttendanceStatus(e, rec, config, now, attendanceDate),
      checkInTime: rec?.checkIn?.time || null,
      checkOutTime: rec?.checkOut?.time || null,
    };
  });

  const summary = { OnTime: 0, Late: 0, HalfDay: 0, Absent: 0, Leave: 0 };
  for (const r of rows) summary[r.status] = (summary[r.status] || 0) + 1;

  const leaveRequests = await LeaveRequest.find({}).sort({ requestedAt: -1 }).limit(20);

  return NextResponse.json({ date, summary, rows, leaveRequests }, {headers:{'Cache-Control':'no-store'}});
}

