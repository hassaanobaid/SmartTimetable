require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { auth } = require('./middleware/auth');
const { crudRouter, specs } = require('./routes/crud');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, db: 'connected' }); }
  catch (e) { res.status(500).json({ ok: false, db: 'error', error: e.message }); }
});

app.use('/api/auth', require('./routes/auth'));
for (const [path, spec] of Object.entries(specs)) app.use('/api/' + path, auth, crudRouter(spec));
app.use('/api/availability', auth, require('./routes/availability'));
app.use('/api/timetable', auth, require('./routes/timetable'));
app.use('/api/stats', auth, require('./routes/stats'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

const PORT = process.env.PORT || 5000;
pool.query('SELECT 1')
  .then(() => console.log('MySQL connected'))
  .catch((e) => console.error('MySQL connection FAILED: ' + e.message + '\n-> Start MySQL in XAMPP and import database/database.sql'));
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
