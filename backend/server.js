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
    
    // Pjesa nga 'main' për të siguruar kolonën 'type'
    const fixDatabaseQuery = "ALTER TABLE properties ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BUY'";
    db.query(fixDatabaseQuery, (err) => {
        if (!err) console.log('✅ Database checked/updated!');
    });
});

// --- API ROUTES: PROPERTIES ---
app.get('/api/properties', (req, res) => {
    db.query("SELECT * FROM properties", (err, results) => {
        if (err) {
            console.error("❌ SQL Error (GET):", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

app.post('/api/properties', (req, res) => {
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sql = "INSERT INTO properties (title, price, location, status, type, image, rooms, bathrooms, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, price, location, status, type, image, rooms, bathrooms, area], (err, result) => {
        if (err) {
            console.error("❌ SQL Error (POST):", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

app.put('/api/properties/:id', (req, res) => {
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sql = "UPDATE properties SET title = ?, price = ?, location = ?, status = ?, type = ?, image = ?, rooms = ?, bathrooms = ?, area = ? WHERE id = ?";
    db.query(sql, [title, price, location, status, type, image, rooms, bathrooms, area, req.params.id], (err) => {
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

// --- API ROUTES: CLIENTS ---
app.get('/api/clients', (req, res) => {
    db.query("SELECT * FROM clients", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/clients', (req, res) => {
    const { user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;
    const sql = "INSERT INTO clients (user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Client created successfully!" });
    });
});

// --- API ROUTES: FAVORITES ---
app.post('/api/favorites', (req, res) => {
    const { client_id, property_id } = req.body;
    db.query("INSERT INTO favorites (client_id, property_id) VALUES (?, ?)", [client_id, property_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Favorite added!" });
    });
});

// --- API ROUTES: REVIEWS ---
app.get('/api/reviews/:agent_id', (req, res) => {
    db.query("SELECT * FROM reviews WHERE agent_id = ?", [req.params.agent_id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/reviews', (req, res) => {
    const { agent_id, client_id, vleresimi, komenti } = req.body;
    db.query("INSERT INTO reviews (agent_id, client_id, vleresimi, komenti) VALUES (?, ?, ?, ?)", [agent_id, client_id, vleresimi, komenti], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Review added successfully!" });
    });
});

app.listen(5000, () => console.log('🚀 Serveri po punon në http://localhost:5000'));