const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'iloveMYSQL@06',   // 🔴 CHANGE if you have password
  database: 'journal_app',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.log('DB Error:', err);
  } else {
    console.log('MySQL Connected');
  }
});

// ✅ SAVE ENTRY API
app.post('/save', (req, res) => {
  const { name, title, body, mood, wc } = req.body;

  const sql = `
    INSERT INTO entries (name, title, body, mood, wc)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, title, body, mood, wc], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Error saving');
    }
    res.send('Saved successfully');
  });
});
// ✅ DELETE ENTRY
app.delete('/delete/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM entries WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Error deleting');
    }
    res.send('Deleted successfully');
  });
});

// ✅ GET ENTRIES (to check data)
app.get('/entries', (req, res) => {
  db.query('SELECT * FROM entries ORDER BY id DESC', (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});