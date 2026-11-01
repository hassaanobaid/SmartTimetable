const express = require('express');
const pool = require('../db');
const { adminOnly } = require('../middleware/auth');
const { EMAIL_RE } = require('../validators');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const specs = {
  teachers: {
    table: 'teachers', orderBy: 'name',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'department', label: 'Department', type: 'text' },
    ],
  },
  sections: {
    table: 'sections', orderBy: 'name',
    fields: [
      { name: 'name', label: 'Section name', type: 'text', required: true, max: 50 },
      { name: 'size', label: 'Number of students', type: 'int', required: true, min: 1, max: 500 },
    ],
  },
  rooms: {
    table: 'rooms', orderBy: 'name',
    fields: [
      { name: 'name', label: 'Room name', type: 'text', required: true, max: 50 },
      { name: 'capacity', label: 'Capacity', type: 'int', required: true, min: 1, max: 1000 },
      { name: 'is_lab', label: 'Lab room', type: 'bool' },
    ],
  },
  'time-slots': {
    table: 'time_slots',
    orderBy: "FIELD(day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), start_time",
    fields: [
      { name: 'day', label: 'Day', type: 'enum', values: DAYS, required: true },
      { name: 'start_time', label: 'Start time', type: 'time', required: true },
      { name: 'end_time', label: 'End time', type: 'time', required: true },
    ],
    check: (d) => (d.end_time <= d.start_time ? 'End time must be after start time' : null),
  },
  courses: {
    table: 'courses',
    listSql: `SELECT c.*, t.name AS teacher_name, s.name AS section_name
              FROM courses c JOIN teachers t ON t.id = c.teacher_id JOIN sections s ON s.id = c.section_id
              ORDER BY s.name, c.code`,
    fields: [
      { name: 'code', label: 'Course code', type: 'text', required: true, max: 20 },
      { name: 'name', label: 'Course name', type: 'text', required: true },
      { name: 'classes_per_week', label: 'Classes per week', type: 'int', required: true, min: 1, max: 5 },
      { name: 'is_lab', label: 'Lab course', type: 'bool' },
      { name: 'teacher_id', label: 'Teacher', type: 'int', required: true },
      { name: 'section_id', label: 'Section', type: 'int', required: true },
    ],
  },
};

function clean(spec, body) {
  const data = {};
  const errors = [];
  for (const f of spec.fields) {
    let v = body[f.name];
    if (f.type === 'bool') { data[f.name] = v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0; continue; }
    if (v === undefined || v === null || String(v).trim() === '') {
      if (f.required) errors.push(`${f.label} is required`);
      data[f.name] = null;
      continue;
    }
    v = typeof v === 'string' ? v.trim() : v;
    if (f.type === 'int') {
      const n = Number(v);
      if (!Number.isInteger(n) || n < (f.min ?? 1) || (f.max && n > f.max))
        errors.push(`${f.label} must be a whole number${f.max ? ` between ${f.min ?? 1} and ${f.max}` : ''}`);
      data[f.name] = n;
    } else if (f.type === 'email') {
      if (!EMAIL_RE.test(v)) errors.push(`${f.label} is not a valid email`);
      data[f.name] = v.toLowerCase();
    } else if (f.type === 'enum') {
      if (!f.values.includes(v)) errors.push(`${f.label} is invalid`);
      data[f.name] = v;
    } else if (f.type === 'time') {
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(v)) errors.push(`${f.label} must be HH:MM`);
      data[f.name] = v.length === 5 ? v + ':00' : v;
    } else {
      if (v.length > (f.max || 100)) errors.push(`${f.label} is too long`);
      data[f.name] = v;
    }
  }
  if (!errors.length && spec.check) {
    const e = spec.check(data);
    if (e) errors.push(e);
  }
  return { data, errors };
}

function dbError(e, res) {
  if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This record already exists (duplicate value).' });
  if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'The selected teacher/section does not exist.' });
  console.error(e);
  return res.status(500).json({ error: 'Server error: ' + e.message });
}

function crudRouter(spec) {
  const router = express.Router();
  const cols = spec.fields.map((f) => f.name);

  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query(spec.listSql || `SELECT * FROM ${spec.table} ORDER BY ${spec.orderBy}`);
      res.json(rows);
    } catch (e) { dbError(e, res); }
  });

  router.post('/', adminOnly, async (req, res) => {
    const { data, errors } = clean(spec, req.body);
    if (errors.length) return res.status(400).json({ error: errors.join('. ') });
    try {
      const [r] = await pool.query(
        `INSERT INTO ${spec.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        cols.map((c) => data[c])
      );
      res.status(201).json({ id: r.insertId, ...data });
    } catch (e) { dbError(e, res); }
  });

  router.put('/:id', adminOnly, async (req, res) => {
    const { data, errors } = clean(spec, req.body);
    if (errors.length) return res.status(400).json({ error: errors.join('. ') });
    try {
      const [r] = await pool.query(
        `UPDATE ${spec.table} SET ${cols.map((c) => c + '=?').join(',')} WHERE id=?`,
        [...cols.map((c) => data[c]), req.params.id]
      );
      if (!r.affectedRows) return res.status(404).json({ error: 'Record not found' });
      res.json({ id: Number(req.params.id), ...data });
    } catch (e) { dbError(e, res); }
  });

  router.delete('/:id', adminOnly, async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${spec.table} WHERE id=?`, [req.params.id]);
      res.json({ ok: true });
    } catch (e) { dbError(e, res); }
  });

  return router;
}

module.exports = { crudRouter, specs, clean };
