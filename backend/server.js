const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const reviewRoutes = require('./routes/reviews');

const app = express();

app.use(cors());
app.use(express.json());
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
});


app.get('/api/properties', (req, res) => {

    const sqlQuery = "SELECT * FROM properties";

    db.query(sqlQuery, (err, results) => {

        if (err) {
            console.error("Error fetching properties:", err);

            return res.status(500).json({
                error: "Failed to fetch properties from the database."
            });
        }

        res.status(200).json(results);
    });
});


app.get('/api/clients', (req, res) => {

    const sql = "SELECT * FROM clients";

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});


app.get('/api/clients/:id', (req, res) => {

    const sql = "SELECT * FROM clients WHERE id = ?";

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});


app.post('/api/clients', (req, res) => {

    const {
        user_id,
        emri,
        mbiemri,
        telefoni,
        email,
        buxheti_max,
        preferencat,
        lloji_klientit
    } = req.body;

    const sql = `
        INSERT INTO clients
        (user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            user_id,
            emri,
            mbiemri,
            telefoni,
            email,
            buxheti_max,
            preferencat,
            lloji_klientit
        ],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                message: "Client created successfully!"
            });
        }
    );
});


app.put('/api/clients/:id', (req, res) => {

    const { buxheti_max, preferencat } = req.body;

    const sql = `
        UPDATE clients
        SET buxheti_max = ?, preferencat = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [buxheti_max, preferencat, req.params.id],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                message: "Client updated successfully!"
            });
        }
    );
});


app.delete('/api/clients/:id', (req, res) => {

    const sql = "DELETE FROM clients WHERE id = ?";

    db.query(sql, [req.params.id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json({
            message: "Client deleted successfully!"
        });
    });
});


app.get('/api/favorites/:client_id', (req, res) => {

    const sql = "SELECT * FROM favorites WHERE client_id = ?";

    db.query(sql, [req.params.client_id], (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});



app.post('/api/favorites', (req, res) => {

    const { client_id, property_id } = req.body;

    const sql = `
        INSERT INTO favorites (client_id, property_id)
        VALUES (?, ?)
    `;

    db.query(
        sql,
        [client_id, property_id],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                message: "Favorite added successfully!"
            });
        }
    );
});


app.delete('/api/favorites/:id', (req, res) => {

    const sql = "DELETE FROM favorites WHERE id = ?";

    db.query(sql, [req.params.id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json({
            message: "Favorite removed successfully!"
        });
    });
});



app.get('/api/reviews/:agent_id', (req, res) => {

    const sql = "SELECT * FROM reviews WHERE agent_id = ?";

    db.query(sql, [req.params.agent_id], (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});


app.post('/api/reviews', (req, res) => {

    const {
        agent_id,
        client_id,
        vleresimi,
        komenti
    } = req.body;

    const sql = `
        INSERT INTO reviews
        (agent_id, client_id, vleresimi, komenti)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [agent_id, client_id, vleresimi, komenti],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                message: "Review added successfully!"
            });
        }
    );
});


app.put('/api/reviews/:id', (req, res) => {

    const { komenti, vleresimi } = req.body;

    const sql = `
        UPDATE reviews
        SET komenti = ?, vleresimi = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [komenti, vleresimi, req.params.id],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                message: "Review updated successfully!"
            });
        }
    );
});


app.delete('/api/reviews/:id', (req, res) => {

    const sql = "DELETE FROM reviews WHERE id = ?";

    db.query(sql, [req.params.id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json({
            message: "Review deleted successfully!"
        });
    });
});



const PORT = 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});