import ResourcePage from '../components/ResourcePage';

export default function Rooms() {
  return (
    <ResourcePage
      title="Rooms" endpoint="/rooms"
      hint="Classrooms and labs. Lab courses are placed only in lab rooms."
      columns={[
        { key: 'name', label: 'Room' }, { key: 'capacity', label: 'Capacity' },
        { key: 'is_lab', label: 'Type', render: (r) => (r.is_lab ? 'Lab' : 'Classroom') },
      ]}
      fields={[
        { name: 'name', label: 'Room name', type: 'text', required: true },
        { name: 'capacity', label: 'Capacity', type: 'number', required: true, min: 1, max: 1000 },
        { name: 'is_lab', label: 'This is a lab room', type: 'checkbox' },
      ]}
    />
  );
}
