const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'iloveMYSQL@06',        // 👈 PUT YOUR MYSQL PASSWORD HERE
  database: 'journal_app',
  port: 3306           // 👈 YOUR PORT
});

// Connect DB
db.connect((err) => {
  if (err) {
    console.error('❌ DB Error:', err);
    return;
  }
  console.log('✅ MySQL Connected');
});


// ➕ SAVE ENTRY
app.post('/save', (req, res) => {
  const { name, title, body, mood, wc } = req.body;

  const sql = "INSERT INTO entries (name, title, body, mood, wc) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, title, body, mood, wc], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Saved" });
  });
});


// 📥 GET ENTRIES
app.get('/entries', (req, res) => {
  db.query("SELECT * FROM entries ORDER BY created_at DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// ❌ DELETE ENTRY
app.delete('/delete/:id', (req, res) => {
  db.query("DELETE FROM entries WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted" });
  });
});


// 🚀 START SERVER
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});