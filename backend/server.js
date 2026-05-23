const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json()); 

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'findhome_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('✅ Successfully connected to the MySQL Database!');

    // Sigurohemi që kolona 'type' ekziston pa shkaktuar probleme
    const fixDatabaseQuery = "ALTER TABLE properties ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BUY'";
    db.query(fixDatabaseQuery, (err) => {
        if (!err) console.log('✅ Database checked/updated!');
    });
});

// --- API ROUTES: PROPERTIES ---
app.get('/api/properties', (req, res) => {
    db.query("SELECT * FROM properties", (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch." });
        res.status(200).json(results);
    });
});

app.post('/api/properties', (req, res) => {
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sql = `INSERT INTO properties (title, price, location, status, type, image, rooms, bathrooms, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [title, price, location, status, type, image, rooms, bathrooms, area], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to save." });
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

app.delete('/api/properties/:id', (req, res) => {
    db.query("DELETE FROM properties WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete." });
        res.status(200).json({ message: "Deleted!" });
    });
});

app.put('/api/properties/:id', (req, res) => {
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sql = `UPDATE properties SET title = ?, price = ?, location = ?, status = ?, type = ?, image = ?, rooms = ?, bathrooms = ?, area = ? WHERE id = ?`;
    db.query(sql, [title, price, location, status, type, image, rooms, bathrooms, area, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update." });
        res.status(200).json({ id: req.params.id, ...req.body });
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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});