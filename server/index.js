require('dotenv').config();
const { runReminders } = require('./reminders');
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS users FROM users');
    res.json({ status: 'ok', database: 'connected', users: rows[0].users });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/deadlines', require('./routes/deadlines'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/similarity', require('./routes/similarity'));
app.use('/api/review', require('./routes/review'));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    runReminders();
    setInterval(runReminders, 60 * 60 * 1000);
  });
}
module.exports = app;
