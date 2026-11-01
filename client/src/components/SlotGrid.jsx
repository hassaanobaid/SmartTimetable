const ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const hhmm = (t) => String(t).slice(0, 5);

// Weekly grid: columns = days, rows = time ranges. renderCell(slot) draws each cell.
export default function SlotGrid({ slots, renderCell }) {
  const days = [...new Set(slots.map((s) => s.day))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const times = [...new Set(slots.map((s) => hhmm(s.start_time) + '-' + hhmm(s.end_time)))].sort();
  if (!slots.length) return <p className="muted">No time slots yet. Add them in the Time Slots tab.</p>;
  return (
    <div className="table-wrap">
      <table className="grid">
        <thead><tr><th>Time</th>{days.map((d) => <th key={d}>{d}</th>)}</tr></thead>
        <tbody>
          {times.map((t) => (
            <tr key={t}>
              <th>{t.replace('-', ' - ')}</th>
              {days.map((d) => {
                const slot = slots.find((s) => s.day === d && hhmm(s.start_time) + '-' + hhmm(s.end_time) === t);
                return <td key={d}>{slot ? renderCell(slot) : <span className="muted">-</span>}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
