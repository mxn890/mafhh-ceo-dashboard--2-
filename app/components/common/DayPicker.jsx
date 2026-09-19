'use client';

/**
 * Row of day buttons: Today, Yesterday, then a dropdown for anything older
 * within the last 30 days. Used identically on the employee profile page
 * and the alerts page, so "browse by day" looks and behaves the same
 * everywhere in the dashboard.
 *
 * Props: { days, selected, onSelect } where `days` is the array from
 * lib/dateUtils's lastNDays() — [{date:'YYYY-MM-DD', label}, ...].
 */
export default function DayPicker({ days, selected, onSelect }) {
  const [today, yesterday, ...older] = days;
  const olderSelected = older.some((d) => d.date === selected);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelect(today.date)}
        className={selected === today.date ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
      >
        Today
      </button>
      <button
        onClick={() => onSelect(yesterday.date)}
        className={selected === yesterday.date ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
      >
        Yesterday
      </button>
      <select
        value={olderSelected ? selected : ''}
        onChange={(e) => e.target.value && onSelect(e.target.value)}
        className={
          'rounded-lg border px-3 py-1.5 text-sm ' +
          (olderSelected ? 'border-blue-600 text-blue-700 font-medium' : 'border-gray-300 text-gray-600')
        }
      >
        <option value="" disabled>
          {olderSelected ? older.find((d) => d.date === selected)?.label : 'Older...'}
        </option>
        {older.map((d) => (
          <option key={d.date} value={d.date}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
