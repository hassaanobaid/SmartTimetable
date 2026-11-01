-- OPTIONAL demo data. Run ONCE, after database.sql.
USE smart_timetable;

INSERT INTO sections (name, size) VALUES ('BSSE-5A', 40), ('BSSE-5B', 35);
INSERT INTO rooms (name, capacity, is_lab) VALUES
  ('Room 101', 50, 0), ('Room 102', 45, 0), ('Room 103', 40, 0), ('Lab 1', 45, 1);
INSERT INTO teachers (name, email, department) VALUES
  ('Dr. Ahmed Khan',  'ahmed.khan@example.com',  'Software Engineering'),
  ('Ms. Sara Ali',    'sara.ali@example.com',    'Software Engineering'),
  ('Mr. Bilal Hussain','bilal.h@example.com',    'Computer Science'),
  ('Dr. Ayesha Noor', 'ayesha.noor@example.com', 'Software Engineering');

INSERT INTO courses (code, name, classes_per_week, is_lab, teacher_id, section_id) VALUES
 ('SE301','Software Construction',3,0,(SELECT id FROM teachers WHERE name='Dr. Ahmed Khan' LIMIT 1),(SELECT id FROM sections WHERE name='BSSE-5A')),
 ('SE302','Web Engineering',3,0,(SELECT id FROM teachers WHERE name='Ms. Sara Ali' LIMIT 1),(SELECT id FROM sections WHERE name='BSSE-5A')),
 ('SE303','Database Systems',2,0,(SELECT id FROM teachers WHERE name='Mr. Bilal Hussain' LIMIT 1),(SELECT id FROM sections WHERE name='BSSE-5A')),
 ('SE304','Software Construction Lab',1,1,(SELECT id FROM teachers WHERE name='Dr. Ayesha Noor' LIMIT 1),(SELECT id FROM sections WHERE name='BSSE-5A')),
 ('SE301','Software Construction',3,0,(SELECT id FROM teachers WHERE name='Dr. Ahmed Khan' LIMIT 1),(SELECT id FROM sections WHERE name='BSSE-5B')),
 ('SE302','Web Engineering',3,0,(SELECT id FROM teachers WHERE name='Ms. Sara Ali' LIMIT 1),(SELECT id FROM sections WHERE name='BSSE-5B')),
 ('SE303','Database Systems',2,0,(SELECT id FROM teachers WHERE name='Mr. Bilal Hussain' LIMIT 1),(SELECT id FROM sections WHERE name='BSSE-5B')),
 ('SE304','Software Construction Lab',1,1,(SELECT id FROM teachers WHERE name='Dr. Ayesha Noor' LIMIT 1),(SELECT id FROM sections WHERE name='BSSE-5B'));
