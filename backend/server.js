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

    // Shton automatikisht 'type' nëse mungon
    const fixDatabaseQuery = "ALTER TABLE properties ADD COLUMN type VARCHAR(50) DEFAULT 'BUY'";
    db.query(fixDatabaseQuery, (err) => {
        if (!err || err.errno === 1060) {
            console.log('✅ Database is ready!');
        }
    });
});

// --- API ROUTES ---

// 1. GET ALL (READ)
app.get('/api/properties', (req, res) => {
    const sqlQuery = "SELECT * FROM properties";
    db.query(sqlQuery, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch." });
        res.status(200).json(results);
    });
});

// 2. CREATE NEW (POST)
app.post('/api/properties', (req, res) => {
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sqlQuery = `INSERT INTO properties (title, price, location, status, type, image, rooms, bathrooms, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [title, price, location, status, type, image, rooms, bathrooms, area];

    db.query(sqlQuery, values, (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to save." });
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

// 3. DELETE (DELETE)
app.delete('/api/properties/:id', (req, res) => {
    const propertyId = req.params.id;
    const sqlQuery = "DELETE FROM properties WHERE id = ?";
    db.query(sqlQuery, [propertyId], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete." });
        res.status(200).json({ message: "Deleted!" });
    });
});

// 4. UPDATE (PUT) - Kjo ishte ajo që ktheu 404!
app.put('/api/properties/:id', (req, res) => {
    const propertyId = req.params.id;
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;

    const sqlQuery = `UPDATE properties SET title = ?, price = ?, location = ?, status = ?, type = ?, image = ?, rooms = ?, bathrooms = ?, area = ? WHERE id = ?`;
    const values = [title, price, location, status, type, image, rooms, bathrooms, area, propertyId];

    db.query(sqlQuery, values, (err) => {
        if (err) return res.status(500).json({ error: "Failed to update." });
        res.status(200).json({ id: propertyId, ...req.body });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});