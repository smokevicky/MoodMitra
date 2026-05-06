const express = require('express');
const cors    = require('cors');
const path    = require('path');
const bcrypt  = require('bcryptjs');
const session = require('express-session');
const Database = require('better-sqlite3');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(session({
  secret: 'moodmitra-2026-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }  // 1 week
}));

// ─── DATABASE ────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'journal.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mood_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    emotion    TEXT NOT NULL,
    source     TEXT DEFAULT 'faceapi',
    smile      REAL DEFAULT 0,
    eye_open   REAL DEFAULT 0,
    brow_raise REAL DEFAULT 0,
    light      REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    name       TEXT,
    title      TEXT,
    body       TEXT,
    mood       TEXT,
    wc         INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe migration: add user_id to old entries table if it doesn't have it
const entryCols = db.pragma('table_info(entries)').map(c => c.name);
if (!entryCols.includes('user_id')) {
  db.exec('ALTER TABLE entries ADD COLUMN user_id INTEGER REFERENCES users(id)');
}

// Safe migration: add columns to mood_history table if they don't exist
const moodCols = db.pragma('table_info(mood_history)').map(c => c.name);
if (!moodCols.includes('photo')) {
  db.exec('ALTER TABLE mood_history ADD COLUMN photo TEXT');
}
if (!moodCols.includes('engine')) {
  db.exec('ALTER TABLE mood_history ADD COLUMN engine TEXT');
}
if (!moodCols.includes('latency')) {
  db.exec('ALTER TABLE mood_history ADD COLUMN latency INTEGER DEFAULT 0');
}

console.log('✅ Database ready  →  journal.db');

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// Register
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  ).run(name, email, hashed);

  req.session.userId   = result.lastInsertRowid;
  req.session.userName = name;
  res.json({ message: 'Registered successfully', name });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'All fields required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid email or password' });

  req.session.userId   = user.id;
  req.session.userName = user.name;
  res.json({ message: 'Logged in', name: user.name });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// Who am I?
app.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  res.json({ user: { id: req.session.userId, name: req.session.userName } });
});

// ─── JOURNAL ENTRIES ──────────────────────────────────────────────────────────
app.post('/save', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in. Please sign in to save stories.' });
  }
  const { title, body, mood, wc } = req.body;
  if (!body) return res.status(400).json({ error: 'Missing content' });

  db.prepare(
    'INSERT INTO entries (name, title, body, mood, wc, user_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    req.session.userName || 'Anonymous',
    title || 'Untitled',
    body,
    mood || '✍️',
    wc || 0,
    req.session.userId
  );
  res.json({ message: 'Saved successfully' });
});

app.get('/entries', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  const rows = db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY id DESC').all(req.session.userId);
  res.json(rows);
});

app.delete('/delete/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  // Only delete if the entry belongs to the logged-in user
  const result = db.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Entry not found or unauthorized' });
  }
  res.json({ message: 'Deleted successfully' });
});

// ─── MOOD HISTORY ─────────────────────────────────────────────────────────────

app.post('/mood', (req, res) => {
  const { emotion, source, smile, eye_open, brow_raise, light, photo, engine, latency } = req.body;
  db.prepare(
    'INSERT INTO mood_history (user_id, emotion, source, smile, eye_open, brow_raise, light, photo, engine, latency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    req.session.userId || null,
    emotion, source || 'faceapi',
    smile || 0, eye_open || 0, brow_raise || 0, light || 0,
    photo || null, engine || null, latency || 0
  );
  res.json({ message: 'Mood saved' });
});

app.get('/mood-history', (req, res) => {
  if (!req.session.userId) return res.json([]);
  const rows = db.prepare(
    'SELECT * FROM mood_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.session.userId);
  res.json(rows);
});

app.delete('/mood/:id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  // Only delete if the record belongs to the current user
  const result = db.prepare(
    'DELETE FROM mood_history WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.session.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Record not found or not yours' });
  res.json({ message: 'Deleted' });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(3000, () => {
  console.log('\n🚀  MoodMitra is running!');
  console.log('👉  http://localhost:3000\n');
});