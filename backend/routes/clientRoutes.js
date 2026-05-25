const express = require('express');
const router = express.Router();
const db = require('../db');

// Merr të gjithë klientët
router.get('/', (req, res) => {
    db.query('SELECT * FROM Clients', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Shto një klient të ri
router.post('/', (req, res) => {
    const { user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;
    const sql = "INSERT INTO Clients (user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Klienti u shtua!", id: result.insertId });
    });
});

// Ndrysho buxhetin ose preferencat (PUT)
router.put('/:id', (req, res) => {
    const { buxheti_max, preferencat } = req.body;
    db.query("UPDATE Clients SET buxheti_max = ?, preferencat = ? WHERE id = ?", [buxheti_max, preferencat, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Klienti u përditësua!" });
    });
});

// Fshi një klient
router.delete('/:id', (req, res) => {
    db.query("DELETE FROM Clients WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Klienti u fshi!" });
    });
});

module.exports = router;