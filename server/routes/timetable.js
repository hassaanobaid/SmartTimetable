const express = require('express');
const pool = require('../db');
const { adminOnly } = require('../middleware/auth');
const { generate } = require('../scheduler');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.id, c.id AS course_id, c.code, c.name AS course_name, c.is_lab,
             t.id AS teacher_id, t.name AS teacher_name, s.id AS section_id, s.name AS section_name,
             r.id AS room_id, r.name AS room_name, ts.id AS slot_id, ts.day, ts.start_time, ts.end_time
      FROM timetable_entries e
      JOIN courses c ON c.id = e.course_id JOIN teachers t ON t.id = c.teacher_id
      JOIN sections s ON s.id = c.section_id JOIN rooms r ON r.id = e.room_id
      JOIN time_slots ts ON ts.id = e.slot_id`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generate', adminOnly, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [courses] = await conn.query(
      `SELECT c.*, t.name AS teacher_name, s.name AS section_name FROM courses c
       JOIN teachers t ON t.id = c.teacher_id JOIN sections s ON s.id = c.section_id`);
    const [rooms] = await conn.query('SELECT * FROM rooms');
    const [slots] = await conn.query('SELECT * FROM time_slots');
    const [sections] = await conn.query('SELECT * FROM sections');
    const [av] = await conn.query('SELECT teacher_id, slot_id FROM teacher_availability');
    if (!courses.length || !rooms.length || !slots.length)
      return res.status(400).json({ error: 'Add at least one course, room and time slot before generating.' });

    const result = generate({ courses, rooms, slots, sections, unavailable: new Set(av.map((a) => `${a.teacher_id}:${a.slot_id}`)) });

    await conn.beginTransaction();
    await conn.query('DELETE FROM timetable_entries');
    if (result.assignments.length)
      await conn.query('INSERT INTO timetable_entries (course_id, room_id, slot_id) VALUES ?',
        [result.assignments.map((a) => [a.course_id, a.room_id, a.slot_id])]);
    await conn.commit();

    const { assignments, ...summary } = result;
    res.json(summary);
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ error: 'Generation failed: ' + e.message });
  } finally { conn.release(); }
});

router.delete('/', adminOnly, async (req, res) => {
  try { await pool.query('DELETE FROM timetable_entries'); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
