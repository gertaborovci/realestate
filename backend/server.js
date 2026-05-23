const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'findhome_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Lidhja me databazën dështoi:', err.message);
        return;
    }
    console.log('✅ Lidhja me databazën u realizua!');
});

// GET - Tani është i pastër
app.get('/api/properties', (req, res) => {
    db.query("SELECT * FROM properties", (err, results) => {
        if (err) {
            console.error("❌ SQL Error (GET):", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// POST - Hequr 'type' që të përputhet me tabelën
app.post('/api/properties', (req, res) => {
    const { title, price, location, status, image, rooms, bathrooms, area } = req.body;
    const sql = "INSERT INTO properties (title, price, location, status, image, rooms, bathrooms, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, price, location, status, image, rooms, bathrooms, area], (err, result) => {
        if (err) {
            console.error("❌ SQL Error (POST):", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

// PUT - Hequr 'type'
app.put('/api/properties/:id', (req, res) => {
    const { title, price, location, status, image, rooms, bathrooms, area } = req.body;
    const sql = "UPDATE properties SET title = ?, price = ?, location = ?, status = ?, image = ?, rooms = ?, bathrooms = ?, area = ? WHERE id = ?";
    db.query(sql, [title, price, location, status, image, rooms, bathrooms, area, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "U përditësua me sukses!" });
    });
});

app.delete('/api/properties/:id', (req, res) => {
    db.query("DELETE FROM properties WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "U fshi me sukses!" });
    });
});

app.listen(5000, () => console.log('🚀 Serveri po punon në http://localhost:5000'));