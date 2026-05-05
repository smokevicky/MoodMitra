const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// 1. MIDDLEWARE: This fixes the "null" issue
app.use(express.json()); 
app.use(cors());

// 2. DATABASE CONNECTION: Put your password here
const db = mysql.createConnection({ 
    host: 'localhost', 
    port: 3306,             // Explicitly adding the port
    user: 'root',           // Standard default user
    password: 'iloveMYSQL@06', // Replace this with your actual password!
    database: 'moodmitra'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database!');
});

// 3. ROUTES: Your POST request goes here
app.post('/api/stories', (req, res) => {
    const { username, content } = req.body;
    
    // Safety check
    if (!username || !content) {
        return res.status(400).send("Missing data");
    }

    const query = 'INSERT INTO stories (username, content) VALUES (?, ?)';
    db.query(query, [username, content], (err, result) => {
        if (err) {
            console.error("DATABASE ERROR:", err); 
            return res.status(500).send("Database error: " + err.message);
        }
        res.status(200).send({ message: 'Success' });
    });
});

// 4. GET ROUTE: Added this so your page can load existing stories
app.get('/api/stories', (req, res) => {
    db.query('SELECT * FROM stories ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error("Error fetching stories:", err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});
const path = require('path');
app.use(express.static(__dirname));

// 5. START SERVER: This must always be at the bottom
app.listen(3000, () => console.log('Server running on http://localhost:3000'));