const express = require('express');
const pool = require('../db');
const { adminOnly } = require('../middleware/auth');
const router = express.Router();

// Slots where the teacher is NOT available
router.get('/:teacherId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT slot_id FROM teacher_availability WHERE teacher_id = ?', [req.params.teacherId]);
    res.json({ slotIds: rows.map((r) => r.slot_id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:teacherId', adminOnly, async (req, res) => {
  const ids = Array.isArray(req.body.slotIds) ? req.body.slotIds.map(Number).filter(Number.isInteger) : [];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM teacher_availability WHERE teacher_id = ?', [req.params.teacherId]);
    if (ids.length)
      await conn.query('INSERT INTO teacher_availability (teacher_id, slot_id) VALUES ?', [ids.map((s) => [Number(req.params.teacherId), s])]);
    await conn.commit();
    res.json({ ok: true, saved: ids.length });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

module.exports = router;
