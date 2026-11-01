import ResourcePage from '../components/ResourcePage';

export default function Sections() {
  return (
    <ResourcePage
      title="Sections" endpoint="/sections"
      hint="A section is a group of students that attends classes together (example: BSSE-5A)."
      columns={[{ key: 'name', label: 'Section' }, { key: 'size', label: 'Students' }]}
      fields={[
        { name: 'name', label: 'Section name', type: 'text', required: true },
        { name: 'size', label: 'Number of students', type: 'number', required: true, min: 1, max: 500 },
      ]}
    />
  );
}
