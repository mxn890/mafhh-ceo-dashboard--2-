import { addDays, dayPKT, missingStatus, shiftLabel } from './attendance-policy';
import { validWorkDate } from './work-calendar';

// Missing check-ins are calendar rows, even when no Mongo document was created.
// Keep explicit leave/manual decisions and real check-ins authoritative.
export function resolvedAttendanceStatus(employee, record, config, now, date) {
  if (record && (record.checkIn?.time || record.status === 'Leave' || record.reviewedBy)) return record.status;
  return missingStatus(employee, config, now, date);
}

export function calendarHistory(employee, records, config = {}, days = 30, now = new Date()) {
  const count = Math.min(180, Math.max(1, Number.isInteger(days) ? days : 30));
  const today = dayPKT(now), first = addDays(today, 1 - count);
  const byDate = new Map(records.map(record => [record.date, record]));
  const created = employee.createdAt ? new Date(employee.createdAt) : null;
  const createdDay = created && Number.isFinite(+created) ? dayPKT(created) : today;
  const observedDays = records.map(r => r.date).filter(validWorkDate).sort();
  const enrolledDay = observedDays.length ? [createdDay, observedDays[0]].sort()[0] : createdDay;
  const output = [];
  for (let date = today; date >= first; date = addDays(date, -1)) {
    const record = byDate.get(date);
    // Never invent employment history before the employee was registered.
    // Existing older records remain visible if the employee was migrated later.
    if (!record && date < enrolledDay) continue;
    output.push({
      date,
      status: resolvedAttendanceStatus(employee, record, config, now, date),
      derived: !record,
      shift_timing: shiftLabel(employee, config, date),
      checkInTime: record?.checkIn?.time || null,
      checkOutTime: record?.checkOut?.time || null,
      checkInLocation: record?.checkIn?.locationLabel || null,
      checkInPhoto: record?.checkIn?.photo || null,
      checkOutPhoto: record?.checkOut?.photo || null,
    });
  }
  return output;
}

export function attendanceSummary(rows) {
  const result = { OnTime: 0, Late: 0, HalfDay: 0, Absent: 0, Leave: 0, Off: 0, Pending: 0, Scheduled: 0, ShiftNotSet: 0 };
  for (const row of rows) if (Object.hasOwn(result, row.status)) result[row.status]++;
  return result;
}
