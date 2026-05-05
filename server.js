const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Serve all HTML/CSS/JS files from this folder ──────────────────────────
// Always open the app via http://localhost:3000 — not by double-clicking files
app.use(express.static(__dirname));

// ─── SQLite Database ────────────────────────────────────────────────────────
// Automatically creates 'journal.db' in this folder on first run.
// No MySQL, no extra installation. Just works!
const db = new Database(path.join(__dirname, 'journal.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT,
    title      TEXT,
    body       TEXT,
    mood       TEXT,
    wc         INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Database ready  →  journal.db');

// ─── SAVE ENTRY ─────────────────────────────────────────────────────────────
app.post('/save', (req, res) => {
  const { name, title, body, mood, wc } = req.body;

  if (!body) {
    return res.status(400).json({ error: 'Missing content' });
  }

  const stmt = db.prepare(
    'INSERT INTO entries (name, title, body, mood, wc) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(name || 'Anonymous', title || 'Untitled', body, mood || '✍️', wc || 0);
  res.json({ message: 'Saved successfully' });
});

// ─── GET ALL ENTRIES ────────────────────────────────────────────────────────
app.get('/entries', (req, res) => {
  const rows = db.prepare('SELECT * FROM entries ORDER BY id DESC').all();
  res.json(rows);
});

// ─── DELETE ENTRY ───────────────────────────────────────────────────────────
app.delete('/delete/:id', (req, res) => {
  db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted successfully' });
});

// ─── START ──────────────────────────────────────────────────────────────────
app.listen(3000, () => {
  console.log('');
  console.log('🚀  MoodMitra is running!');
  console.log('👉  Open in browser → http://localhost:3000/story.html');
  console.log('');
});