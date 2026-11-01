import ResourcePage from '../components/ResourcePage';
import { hhmm } from '../components/SlotGrid';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => ({ value: d, label: d }));

export default function TimeSlots() {
  return (
    <ResourcePage
      title="Time Slots" endpoint="/time-slots"
      hint="Default slots (Monday to Friday, 5 per day) are created by database.sql. You can add or remove slots."
      columns={[
        { key: 'day', label: 'Day' },
        { key: 'start_time', label: 'Start', render: (r) => hhmm(r.start_time) },
        { key: 'end_time', label: 'End', render: (r) => hhmm(r.end_time) },
      ]}
      fields={[
        { name: 'day', label: 'Day', type: 'select', options: DAYS, required: true },
        { name: 'start_time', label: 'Start time', type: 'time', required: true },
        { name: 'end_time', label: 'End time', type: 'time', required: true },
      ]}
    />
  );
}
