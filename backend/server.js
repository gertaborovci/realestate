const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// Importet nga dega jote
const reviewRoutes = require('./routes/reviews');

const app = express();

app.use(cors()); 
app.use(express.json()); 

// Rrugët e reviews
app.use('/api/reviews', reviewRoutes);

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

    const fixDatabaseQuery = "ALTER TABLE properties ADD COLUMN type VARCHAR(50) DEFAULT 'BUY'";
    db.query(fixDatabaseQuery, (err) => {
        if (!err || err.errno === 1060) {
            console.log('✅ Database is ready!');
        }
    });
});

// --- API ROUTES: PROPERTIES ---
app.get('/api/properties', (req, res) => {
    const sqlQuery = "SELECT * FROM properties";
    db.query(sqlQuery, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch." });
        res.status(200).json(results);
    });
});

app.post('/api/properties', (req, res) => {
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sqlQuery = `INSERT INTO properties (title, price, location, status, type, image, rooms, bathrooms, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [title, price, location, status, type, image, rooms, bathrooms, area];
    db.query(sqlQuery, values, (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to save." });
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

app.delete('/api/properties/:id', (req, res) => {
    const propertyId = req.params.id;
    db.query("DELETE FROM properties WHERE id = ?", [propertyId], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete." });
        res.status(200).json({ message: "Deleted!" });
    });
});

app.put('/api/properties/:id', (req, res) => {
    const propertyId = req.params.id;
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sqlQuery = `UPDATE properties SET title = ?, price = ?, location = ?, status = ?, type = ?, image = ?, rooms = ?, bathrooms = ?, area = ? WHERE id = ?`;
    db.query(sqlQuery, [title, price, location, status, type, image, rooms, bathrooms, area, propertyId], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update." });
        res.status(200).json({ id: propertyId, ...req.body });
    });
});

// --- API ROUTES: CLIENTS ---
app.get('/api/clients', (req, res) => {
    db.query("SELECT * FROM clients", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/api/clients/:id', (req, res) => {
    db.query("SELECT * FROM clients WHERE id = ?", [req.params.id], (err, results) => {
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

app.put('/api/clients/:id', (req, res) => {
    const { buxheti_max, preferencat } = req.body;
    db.query("UPDATE clients SET buxheti_max = ?, preferencat = ? WHERE id = ?", [buxheti_max, preferencat, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Client updated successfully!" });
    });
});

app.delete('/api/clients/:id', (req, res) => {
    db.query("DELETE FROM clients WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Client deleted successfully!" });
    });
});

// --- API ROUTES: FAVORITES ---
app.get('/api/favorites/:client_id', (req, res) => {
    db.query("SELECT * FROM favorites WHERE client_id = ?", [req.params.client_id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/favorites', (req, res) => {
    const { client_id, property_id } = req.body;
    db.query("INSERT INTO favorites (client_id, property_id) VALUES (?, ?)", [client_id, property_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Favorite added successfully!" });
    });
});

app.delete('/api/favorites/:id', (req, res) => {
    db.query("DELETE FROM favorites WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Favorite removed successfully!" });
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

app.put('/api/reviews/:id', (req, res) => {
    const { komenti, vleresimi } = req.body;
    db.query("UPDATE reviews SET komenti = ?, vleresimi = ? WHERE id = ?", [komenti, vleresimi, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Review updated successfully!" });
    });
});

app.delete('/api/reviews/:id', (req, res) => {
    db.query("DELETE FROM reviews WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Review deleted successfully!" });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});