import ResourcePage from '../components/ResourcePage';

export default function Teachers() {
  return (
    <ResourcePage
      title="Teachers" endpoint="/teachers"
      hint="Add every teacher who will be scheduled."
      columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'department', label: 'Department' }]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'department', label: 'Department', type: 'text' },
      ]}
    />
  );
}
