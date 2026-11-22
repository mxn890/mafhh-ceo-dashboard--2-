import { calendarHistory, attendanceSummary } from '@/app/lib/attendance-calendar';
import { addDays, dayPKT } from '@/app/lib/attendance-policy';
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/connect';
import { Employee, Attendance, AttendanceConfig } from '@/app/lib/db/models';
import { getSession } from '@/app/lib/auth/jwt';

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session || !['ceo', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'CEO or admin access required.' }, { status: 403 });
  }

  const { employeeId } = await params;
  const requestedDays = Number(request.nextUrl.searchParams.get('days') || 30);
  const days = Number.isInteger(requestedDays) ? Math.min(180, Math.max(1, requestedDays)) : 30;

  await connectDB();
  const employee = await Employee.findOne({ employeeId });
  if (!employee) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });

  const now = new Date(), today = dayPKT(now), first = addDays(today, 1 - days);
  const config = (await AttendanceConfig.findOne({key:'default'}).lean()) || {};
  const savedRecords = await Attendance.find({ employeeId, date: {$gte:first, $lte:today} }).sort({date:-1});
  const records = calendarHistory(employee, savedRecords, config, days, now);

  const summary = attendanceSummary(records);

  return NextResponse.json({
    employee: { employeeId: employee.employeeId, name: employee.name, department: employee.department },
    records,
    summary,
    dateRange: {first, last:today},
    absencePolicy: 'Working day without check-in becomes Absent after its shift ends; scheduled off remains Off.',
  }, {headers:{'Cache-Control':'no-store'}});
}

