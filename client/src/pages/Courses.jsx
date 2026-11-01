import ResourcePage from '../components/ResourcePage';

export default function Courses() {
  return (
    <ResourcePage
      title="Courses" endpoint="/courses"
      hint="Each row is one course taught to one section by one teacher. Add the teachers and sections first."
      columns={[
        { key: 'code', label: 'Code' }, { key: 'name', label: 'Course' },
        { key: 'section_name', label: 'Section' }, { key: 'teacher_name', label: 'Teacher' },
        { key: 'classes_per_week', label: 'Classes / week' },
        { key: 'is_lab', label: 'Type', render: (r) => (r.is_lab ? 'Lab' : 'Theory') },
      ]}
      fields={[
        { name: 'code', label: 'Course code', type: 'text', required: true },
        { name: 'name', label: 'Course name', type: 'text', required: true },
        { name: 'classes_per_week', label: 'Classes per week', type: 'number', required: true, min: 1, max: 5 },
        { name: 'teacher_id', label: 'Teacher', type: 'select', required: true, optionsEndpoint: '/teachers', optionLabel: (t) => t.name },
        { name: 'section_id', label: 'Section', type: 'select', required: true, optionsEndpoint: '/sections', optionLabel: (s) => s.name },
        { name: 'is_lab', label: 'This is a lab course', type: 'checkbox' },
      ]}
    />
  );
}
