const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const out = {};
    for (const [k, t] of Object.entries({
      teachers: 'teachers', courses: 'courses', rooms: 'rooms',
      sections: 'sections', slots: 'time_slots', entries: 'timetable_entries',
    })) {
      const [[row]] = await pool.query(`SELECT COUNT(*) AS n FROM ${t}`);
      out[k] = row.n;
    }
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
