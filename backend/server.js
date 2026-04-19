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
});


// --- API ROUTES ---

// 1. GET ALL PROPERTIES (READ)
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


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});