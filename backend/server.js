const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');


const app = express();


app.use(cors()); // Allows requests from your React frontend
app.use(express.json()); // Allows the server to read JSON data


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Default XAMPP username
    password: '',      // Default XAMPP password is blank
    database: 'findhome_db'
});


db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('✅ Successfully connected to the MySQL Database!');
<<<<<<< Updated upstream
});


// --- API ROUTES ---

// 1. GET ALL PROPERTIES (READ)
=======

    const fixDatabaseQuery = "ALTER TABLE properties ADD COLUMN type VARCHAR(50) DEFAULT 'BUY'";
    db.query(fixDatabaseQuery, (err) => {
        if (!err || err.errno === 1060) {
            console.log('✅ Database is ready!');
        }
    });
});


>>>>>>> Stashed changes
app.get('/api/properties', (req, res) => {
    // The SQL query to select all columns from the properties table
    const sqlQuery = "SELECT * FROM properties";

    // Execute the query
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error("Error fetching properties:", err);
            // Send a 500 Internal Server Error status if something goes wrong
            return res.status(500).json({ error: "Failed to fetch properties from the database." });
        }
        // If successful, send the results back as JSON
        res.status(200).json(results);
    });
});

<<<<<<< Updated upstream
=======
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
    const sqlQuery = "DELETE FROM properties WHERE id = ?";
    db.query(sqlQuery, [propertyId], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete." });
        res.status(200).json({ message: "Deleted!" });
    });
});

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
>>>>>>> Stashed changes


app.post('/api/visits', (req, res) => {
    const { property_id, user_id, visit_date, visit_time } = req.body;

    if (!property_id || !user_id || !visit_date || !visit_time) {
        return res.status(400).json({ error: "Të gjitha fushat janë të detyrueshme!" });
    }

    const checkSql = "SELECT * FROM visits WHERE property_id = ? AND visit_date = ? AND visit_time = ? AND status != 'CANCELLED'";
    db.query(checkSql, [property_id, visit_date, visit_time], (err, results) => {
        if (err) return res.status(500).json({ error: "Gabim gjatë kontrollit të kalendarit." });
        
        if (results.length > 0) {
            return res.status(400).json({ error: "Ky termin është i zënë! Ju lutem zgjidhni një datë ose orë tjetër." });
        }

        const insertSql = "INSERT INTO visits (property_id, user_id, visit_date, visit_time, status) VALUES (?, ?, ?, ?, 'PENDING')";
        db.query(insertSql, [property_id, user_id, visit_date, visit_time], (err, result) => {
            if (err) return res.status(500).json({ error: "Dështoi krijimi i vizitës në databazë." });
            
            res.status(201).json({ 
                message: "Vizita u caktua me sukses!", 
                visitId: result.insertId 
            });
        });
    });
});

app.get('/api/visits', (req, res) => {
    const sql = `
        SELECT v.*, p.title AS property_title, p.location 
        FROM visits v
        LEFT JOIN properties p ON v.property_id = p.id
        ORDER BY v.visit_date ASC, v.visit_time ASC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Gabim gjatë marrjes së vizitave." });
        res.json(results);
    });
});

app.get('/api/reports/stats', (req, res) => {
    const statsSql = `
        SELECT 
            COUNT(id) AS total_contracts,
            SUM(CASE WHEN contract_type = 'BUY' THEN total_amount ELSE 0 END) AS total_sales,
            SUM(CASE WHEN contract_type = 'RENT' THEN total_amount ELSE 0 END) AS total_rents
        FROM contracts`;

    const monthlySql = `
        SELECT DATE_FORMAT(payment_date, '%b') AS month, SUM(amount) AS total
        FROM payments
        WHERE status = 'PAID'
        GROUP BY MONTH(payment_date)
        ORDER BY MONTH(payment_date) ASC`;

    db.query(statsSql, (err, statsResult) => {
        if (err) return res.status(500).json({ error: "Gabim gjatë llogaritjes së statistikave." });

        db.query(monthlySql, (err, monthlyResult) => {
            if (err) return res.status(500).json({ error: "Gabim gjatë marrjes së të dhënave mujore." });

            res.json({
                overview: statsResult[0] || { total_contracts: 0, total_sales: 0, total_rents: 0 },
                monthlyRevenue: monthlyResult
            });
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});